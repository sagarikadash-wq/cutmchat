import React, { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaPhone, FaVideo } from "react-icons/fa";
import {
	setChatDetailsBox,
	setMessageLoading,
	setCallStatus,
	setCallData,
} from "../../redux/slices/conditionSlice";
import { useDispatch, useSelector } from "react-redux";
import AllMessages from "./AllMessages";
import MessageSend from "./MessageSend";
import { addAllMessages } from "../../redux/slices/messageSlice";
import MessageLoading from "../loading/MessageLoading";
import { addSelectedChat } from "../../redux/slices/myChatSlice";
import getChatName, { getChatImage } from "../../utils/getChatName";
import ChatDetailsBox from "../chatDetails/ChatDetailsBox";
import { CiMenuKebab } from "react-icons/ci";
import { toast } from "react-toastify";
import socket from "../../socket/socket";
import { apiCall } from "../../utils/apiHelper";

const MessageBox = ({ chatId }) => {
	const dispatch = useDispatch();
	const chatDetailsBox = useRef(null);
	const [showMenu, setShowMenu] = useState(false);
	const [isExiting, setIsExiting] = useState(false);
	const isChatDetailsBox = useSelector(
		(store) => store?.condition?.isChatDetailsBox
	);
	const isMessageLoading = useSelector(
		(store) => store?.condition?.isMessageLoading
	);
	const allMessage = useSelector((store) => store?.message?.message);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const authUser = useSelector((store) => store?.auth);
	const authUserId = authUser?._id;

	useEffect(() => {
		const getMessage = async (chatId) => {
			const token = localStorage.getItem("token");
			if (!token || token === "undefined") return;

			dispatch(setMessageLoading(true));
			try {
				const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/message/${chatId}`, {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				dispatch(addAllMessages(json?.data || []));
				socket.emit("join chat", selectedChat._id);
			} catch (err) {
				console.log(err);
				toast.error("Message Loading Failed");
			} finally {
				dispatch(setMessageLoading(false));
			}
		};
		getMessage(chatId);
	}, [chatId]);

	// chatDetailsBox outside click handler
	const handleClickOutside = (event) => {
		if (
			chatDetailsBox.current &&
			!chatDetailsBox.current.contains(event.target)
		) {
			setIsExiting(true);
			setTimeout(() => {
				dispatch(setChatDetailsBox(false));
				setIsExiting(false);
			}, 500);
		}
	};

	// add && remove events according to isChatDetailsBox
	useEffect(() => {
		if (isChatDetailsBox) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isChatDetailsBox]);

	const handleClearChat = async () => {
		const token = localStorage.getItem("token");
		try {
			const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/message/clear/${chatId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (json.message === "success") {
				dispatch(addAllMessages([]));
				socket.emit("clear chat", chatId);
				toast.success("Chat cleared!");
				setShowMenu(false);
			}
		} catch (err) {
			toast.error("Failed to clear chat");
		}
	};

	const handleDeleteChat = async () => {
		const token = localStorage.getItem("token");
		try {
			const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/chat/delete-group/${chatId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (json.message === "success") {
				socket.emit("delete chat", chatId);
				dispatch(addSelectedChat(null));
				toast.success("Chat deleted!");
				setShowMenu(false);
			}
		} catch (err) {
			toast.error("Failed to delete chat");
		}
	};

	return (
		<div className="flex flex-col h-full w-full relative">
			<div
				className="flex-none py-4 sm:px-6 px-3 w-full h-[80px] font-semibold flex justify-between items-center bg-slate-900/60 backdrop-blur-md text-white border-b border-slate-700/50 z-10"
			>
				<div className="flex items-center gap-3 cursor-pointer" onClick={() => dispatch(setChatDetailsBox(true))}>
					<div
						onClick={(e) => {
							e.stopPropagation();
							dispatch(addSelectedChat(null));
						}}
						className="sm:hidden bg-white/10 hover:bg-white/20 h-10 w-10 rounded-xl flex items-center justify-center cursor-pointer transition-all"
					>
						<FaArrowLeft title="Back" fontSize={18} />
					</div>
					<div className="relative">
						<img
							src={getChatImage(selectedChat, authUserId)}
							alt=""
							className="h-12 w-12 rounded-2xl object-cover border-2 border-blue-500/30"
						/>
						<div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full" />
					</div>
					<div>
						<h1 className="line-clamp-1 text-lg font-bold tracking-tight">
							{getChatName(selectedChat, authUserId)}
						</h1>
						<p className="text-[10px] text-blue-400 font-medium uppercase tracking-widest opacity-80">
							{selectedChat?.isGroupChat ? "Group Chat" : "Online"}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-4 relative">
					<div className="flex items-center gap-4 mr-2">
						{!selectedChat?.isGroupChat && (
							<>
								<button 
									className="p-2.5 bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 rounded-xl transition-all active:scale-90 border border-white/5"
									onClick={() => {
										const otherUser = selectedChat.users.find(u => u._id !== authUserId);
										dispatch(setCallData({ 
											to: otherUser._id, 
											from: authUserId,
											name: getChatName(selectedChat, authUserId),
											image: getChatImage(selectedChat, authUserId),
											callType: "voice" 
										}));
										dispatch(setCallStatus("calling"));
									}}
									title="Voice Call"
								>
									<FaPhone fontSize={18} />
								</button>
								<button 
									className="p-2.5 bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 rounded-xl transition-all active:scale-90 border border-white/5"
									onClick={() => {
										const otherUser = selectedChat.users.find(u => u._id !== authUserId);
										dispatch(setCallData({ 
											to: otherUser._id, 
											from: authUserId,
											name: getChatName(selectedChat, authUserId),
											image: getChatImage(selectedChat, authUserId),
											callType: "video" 
										}));
										dispatch(setCallStatus("calling"));
									}}
									title="Video Call"
								>
									<FaVideo fontSize={18} />
								</button>
							</>
						)}
					</div>
					<div className="relative">
						<CiMenuKebab
							fontSize={24}
							title="Menu"
							className="cursor-pointer hover:bg-white/10 p-1 rounded-lg transition-all"
							onClick={(e) => {
								e.stopPropagation();
								setShowMenu(!showMenu);
							}}
						/>
						{showMenu && (
							<div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
								<button 
									className="w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-800"
									onClick={() => {
										dispatch(setChatDetailsBox(true));
										setShowMenu(false);
									}}
								>
									View Details
								</button>
								<button 
									className="w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-800"
									onClick={handleClearChat}
								>
									Clear Messages
								</button>
								<button 
									className="w-full text-left px-4 py-3 text-sm hover:bg-red-900/30 text-red-400 transition-colors flex items-center gap-3"
									onClick={handleDeleteChat}
								>
									Delete Chat
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
			{isChatDetailsBox && (
				<div
					className={`h-fit w-full max-w-96 absolute top-20 left-0 z-20 p-1 ${
						isExiting ? "box-exit" : "box-enter"
					}`}
				>
					<div
						ref={chatDetailsBox}
						className="flex border border-slate-400 bg-slate-800 overflow-hidden rounded-lg shadow-2xl"
					>
						<ChatDetailsBox />
					</div>
				</div>
			)}
			<div className="flex-1 overflow-hidden relative">
				{isMessageLoading ? (
					<MessageLoading />
				) : (
					<AllMessages allMessage={allMessage} />
				)}
			</div>
			<div className="flex-none">
				<MessageSend chatId={chatId} />
			</div>
		</div>
	);
};

export default MessageBox;
