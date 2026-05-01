import React, { useEffect, useState } from "react";
import { MdChat } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import UserSearch from "../components/chatComponents/UserSearch";
import MyChat from "../components/chatComponents/MyChat";
import MessageBox from "../components/messageComponents/MessageBox";
import ChatNotSelected from "../components/chatComponents/ChatNotSelected";
import Sidebar from "../components/Sidebar";
import {
	setChatDetailsBox,
	setSocketConnected,
	setUserSearchBox,
} from "../redux/slices/conditionSlice";
import socket from "../socket/socket";
import { addAllMessages, addNewMessage } from "../redux/slices/messageSlice";
import {
	addNewChat,
	addNewMessageRecieved,
	deleteSelectedChat,
} from "../redux/slices/myChatSlice";
import { toast } from "react-toastify";
import { receivedSound } from "../utils/notificationSound";
let selectedChatCompare;

const Home = () => {
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const dispatch = useDispatch();
	const isUserSearchBox = useSelector(
		(store) => store?.condition?.isUserSearchBox
	);
	const authUserId = useSelector((store) => store?.auth?._id);
	const [activeSection, setActiveSection] = useState("chat");

	// socket connection
	useEffect(() => {
		if (!authUserId) return;
		socket.emit("setup", authUserId);
		socket.on("connected", () => dispatch(setSocketConnected(true)));
	}, [authUserId]);

	// socket message received
	useEffect(() => {
		selectedChatCompare = selectedChat;
		const messageHandler = (newMessageReceived) => {
			if (
				selectedChatCompare &&
				selectedChatCompare._id === newMessageReceived.chat._id
			) {
				dispatch(addNewMessage(newMessageReceived));
			} else {
				receivedSound();
				dispatch(addNewMessageRecieved(newMessageReceived));
			}
		};
		socket.on("message received", messageHandler);

		return () => {
			socket.off("message received", messageHandler);
		};
	});

	// socket clear chat messages
	useEffect(() => {
		const clearChatHandler = (chatId) => {
			if (chatId === selectedChat?._id) {
				dispatch(addAllMessages([]));
				toast.success("Cleared all messages");
			}
		};
		socket.on("clear chat", clearChatHandler);
		return () => {
			socket.off("clear chat", clearChatHandler);
		};
	});
	// socket delete chat messages
	useEffect(() => {
		const deleteChatHandler = (chatId) => {
			dispatch(setChatDetailsBox(false));
			if (selectedChat && chatId === selectedChat._id) {
				dispatch(addAllMessages([]));
			}
			dispatch(deleteSelectedChat(chatId));
			toast.success("Chat deleted successfully");
		};
		socket.on("delete chat", deleteChatHandler);
		return () => {
			socket.off("delete chat", deleteChatHandler);
		};
	});

	// socket chat created
	useEffect(() => {
		const chatCreatedHandler = (chat) => {
			dispatch(addNewChat(chat));
			toast.success("Created & Selected chat");
		};
		socket.on("chat created", chatCreatedHandler);
		return () => {
			socket.off("chat created", chatCreatedHandler);
		};
	});

	return (
		<div className="flex w-full h-full border-slate-700/50 sm:border rounded-none sm:rounded-xl overflow-hidden shadow-2xl shadow-black/50 relative bg-slate-900/40 backdrop-blur-sm">
			<Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
			
			<div
				className={`${
					selectedChat && "hidden"
				} sm:block w-full sm:w-[350px] md:w-[400px] h-full bg-black/20 border-r border-slate-700/50 relative transition-all duration-300`}
			>
				<div className="absolute bottom-6 right-6 cursor-pointer text-white z-10">
					<div 
						className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition-all active:scale-95"
						onClick={() => dispatch(setUserSearchBox())}
					>
						<MdChat
							title="New Chat"
							fontSize={28}
						/>
					</div>
				</div>
				{isUserSearchBox ? (
					<div className="h-full"><UserSearch /></div>
				) : (
					<div className="h-full"><MyChat activeSection={activeSection} /></div>
				)}
			</div>
			
			<div
				className={`${
					!selectedChat && "hidden"
				} sm:block flex-1 h-full bg-black/10 relative overflow-hidden transition-all duration-300`}
			>
				{selectedChat ? (
					<MessageBox chatId={selectedChat?._id} />
				) : (
					<ChatNotSelected />
				)}
			</div>
		</div>
	);
};

export default Home;

