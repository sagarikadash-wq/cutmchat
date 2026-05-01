import React, { useEffect, useRef, useState } from "react";
import { FaFolderOpen, FaPaperPlane } from "react-icons/fa";
import { MdOutlineClose } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { setSendLoading, setTyping } from "../../redux/slices/conditionSlice";
import {
	addNewMessage,
	addNewMessageId,
} from "../../redux/slices/messageSlice";
import { LuLoader } from "react-icons/lu";
import { toast } from "react-toastify";
import socket from "../../socket/socket";

import { apiCall } from "../../utils/apiHelper";

let lastTypingTime;
const MessageSend = ({ chatId }) => {
	const mediaFile = useRef();
	// const [mediaBox, setMediaBox] = useState(false);
	// const [mediaURL, setMediaURL] = useState("");
	const [newMessage, setMessage] = useState("");
	const dispatch = useDispatch();
	const isSendLoading = useSelector(
		(store) => store?.condition?.isSendLoading
	);
	const isSocketConnected = useSelector(
		(store) => store?.condition?.isSocketConnected
	);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const isTyping = useSelector((store) => store?.condition?.isTyping);

	useEffect(() => {
		socket.on("typing", () => dispatch(setTyping(true)));
		socket.on("stop typing", () => dispatch(setTyping(false)));
	}, []);

	const [mediaPreview, setMediaPreview] = useState(null);

	// Media Box Control
	const handleMediaBox = () => {
		if (mediaFile.current?.files[0]) {
			const file = mediaFile.current.files[0];
			const reader = new FileReader();
			reader.onloadend = () => {
				setMediaPreview(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	// Media Box Hidden && Input file remove
	// const clearMediaFile = () => {
	//     mediaFile.current.value = "";
	//     setMediaURL("");
	//     setMediaBox(false);
	// };

	// Send Message Api call
	const handleSendMessage = async () => {
		if (newMessage?.trim() || mediaPreview) {
			const message = newMessage?.trim();
			const mediaUrl = mediaPreview;
			const mediaType = mediaPreview ? "image" : "text";
			
			setMessage("");
			setMediaPreview(null);
			if (mediaFile.current) mediaFile.current.value = "";
			
			socket.emit("stop typing", selectedChat._id);
			dispatch(setSendLoading(true));
			const token = localStorage.getItem("token");
			try {
				const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/message`, {
					method: "POST",
					body: JSON.stringify({
						message: message,
						chatId: chatId,
						mediaType: mediaType,
						mediaUrl: mediaUrl,
					}),
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				dispatch(addNewMessageId(json?.data?._id));
				dispatch(addNewMessage(json?.data));
				socket.emit("new message", json.data);
			} catch (err) {
				console.log(err);
				toast.error("Message Sending Failed");
			} finally {
				dispatch(setSendLoading(false));
			}
		}
	};

	const handleTyping = (e) => {
		setMessage(e.target?.value);
		if (!isSocketConnected) return;
		if (!isTyping) {
			socket.emit("typing", selectedChat._id);
		}
		lastTypingTime = new Date().getTime();
		let timerLength = 3000;
		let stopTyping = setTimeout(() => {
			let timeNow = new Date().getTime();
			let timeDiff = timeNow - lastTypingTime;
			if (timeDiff > timerLength) {
				socket.emit("stop typing", selectedChat._id);
			}
		}, timerLength);
		return () => clearTimeout(stopTyping);
	};

	return (
		<div className="w-full p-3 bg-slate-900/80 backdrop-blur-md border-t border-slate-700/50">
			{mediaPreview && (
                <div className="border-slate-600 border bg-slate-800 rounded-2xl absolute bottom-[100%] mb-3 left-3 w-64 h-48 z-10 p-2 flex flex-col shadow-2xl animate-in slide-in-from-bottom-4">
                    <img
                        src={mediaPreview}
                        alt="preview"
                        className="h-full w-full object-cover rounded-xl"
                    />
                    <button
                        title="Remove"
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-all shadow-lg active:scale-90"
                        onClick={() => setMediaPreview(null)}
                    >
                        <MdOutlineClose size={18} />
                    </button>
                </div>
            )}
			<form
				className="w-full flex items-center gap-2"
				onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                }}
			>
				<label htmlFor="media" className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-400 rounded-2xl cursor-pointer transition-all active:scale-90 shadow-inner">
					<FaFolderOpen size={20} />
				</label>
				<input
					ref={mediaFile}
					type="file"
					name="image"
					accept="image/*"
					id="media"
					className="hidden"
					onChange={handleMediaBox}
				/>
                <div className="flex-1 relative flex items-center">
                    <input
                        type="text"
                        className="w-full bg-slate-800 text-white placeholder-slate-500 outline-none p-3 px-5 rounded-2xl border border-transparent focus:border-blue-500/50 transition-all shadow-inner"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => handleTyping(e)}
                    />
                </div>
				
                <button
                    type="submit"
                    disabled={(!newMessage?.trim() && !mediaPreview) || isSendLoading}
                    className={`p-3.5 rounded-2xl transition-all active:scale-90 flex items-center justify-center shadow-lg ${
                        (newMessage?.trim() || mediaPreview) && !isSendLoading
                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40"
                            : "bg-slate-800 text-slate-600 cursor-not-allowed"
                    }`}
                >
                    {isSendLoading ? (
                        <LuLoader size={22} className="animate-spin" />
                    ) : (
                        <FaPaperPlane size={20} />
                    )}
                </button>
			</form>
		</div>
	);
};

export default MessageSend;
