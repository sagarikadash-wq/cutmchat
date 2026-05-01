import React, { useEffect, useState } from "react";
import { FaPenAlt, FaPhone, FaVideo } from "react-icons/fa";
import { MdChat, MdPerson } from "react-icons/md";
import { addMyChat, addSelectedChat } from "../../redux/slices/myChatSlice";
import { useDispatch, useSelector } from "react-redux";
import { setChatLoading, setGroupChatBox, setCallData, setCallStatus } from "../../redux/slices/conditionSlice";
import ChatShimmer from "../loading/ChatShimmer";
import getChatName, { getChatImage, getValidImage } from "../../utils/getChatName";
import { VscCheckAll } from "react-icons/vsc";
import { SimpleDateAndTime, SimpleTime } from "../../utils/formateDateTime";
import { apiCall } from "../../utils/apiHelper";
import socket from "../../socket/socket";

const MyChat = ({ activeSection }) => {
    const dispatch = useDispatch();
    const myChat = useSelector((store) => store.myChat.chat);
    const authUserId = useSelector((store) => store?.auth?._id);
    const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
    const isChatLoading = useSelector(
        (store) => store?.condition?.isChatLoading
    );
    // Re render newmessage send and new group chat created
    const newMessageId = useSelector((store) => store?.message?.newMessageId);
    const isGroupChatId = useSelector((store) => store.condition.isGroupChatId);
    
    const [contacts, setContacts] = useState([]);
    const [callHistory, setCallHistory] = useState([]);

    // All My Chat Api Call
    useEffect(() => {
        const getMyChat = async () => {
            const token = localStorage.getItem("token");
            if (!token || token === "undefined") return;

            dispatch(setChatLoading(true));
            try {
                const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                dispatch(addMyChat(json?.data || []));
            } catch (err) {
                console.log(err);
            } finally {
                dispatch(setChatLoading(false));
            }
        };
        getMyChat();
    }, [newMessageId, isGroupChatId]);

    // Fetch Contacts and Call History
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token || token === "undefined") return;

        if (activeSection === "contacts") {
            const getContacts = async () => {
                dispatch(setChatLoading(true));
                try {
                    const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/user/contacts`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setContacts(json.data || []);
                } catch (err) {
                    console.log(err);
                } finally {
                    dispatch(setChatLoading(false));
                }
            };
            getContacts();
        } else if (activeSection === "calls" || activeSection === "video") {
            const getCallHistory = async () => {
                dispatch(setChatLoading(true));
                try {
                    const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/call/history`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setCallHistory(json.data || []);
                } catch (err) {
                    console.log(err);
                } finally {
                    dispatch(setChatLoading(false));
                }
            };
            getCallHistory();
        }
    }, [activeSection]);

    const handleStartCall = (user, type) => {
        dispatch(setCallData({ 
            from: user._id, 
            name: `${user.firstName} ${user.lastName}`,
            image: user.image,
            callType: type 
        }));
        dispatch(setCallStatus("calling"));
    };
    const filteredChats = myChat.filter(chat => {
        if (activeSection === "groups") return chat.isGroupChat;
        if (activeSection === "chat") return !chat.isGroupChat;
        return false;
    });

    if (activeSection === "calls" || activeSection === "video") {
        const filteredCalls = callHistory.filter(call => call.type === (activeSection === "calls" ? "voice" : "video"));
        
        return (
            <div className="h-full flex flex-col">
                <div className="p-6 w-full font-bold flex justify-between items-center bg-slate-900/50 text-white border-b border-slate-700/50 backdrop-blur-sm">
                    <h1 className="text-2xl tracking-tight capitalize">{activeSection} History</h1>
                </div>
                <div className="flex-1 flex flex-col w-full px-3 gap-2 py-4 overflow-y-auto scroll-style">
                    {filteredCalls.length === 0 && !isChatLoading ? (
                        <div className="flex flex-col items-center justify-center mt-20 text-slate-500 text-center">
                            <div className="bg-slate-800 p-6 rounded-full mb-4 opacity-20">
                                {activeSection === "calls" ? <FaPhone fontSize={40} /> : <FaVideo fontSize={40} />}
                            </div>
                            <p>No recent {activeSection} found.</p>
                        </div>
                    ) : (
                        filteredCalls.map((call) => {
                            const otherUser = call.caller._id === authUserId ? call.receiver : call.caller;
                            const isOutgoing = call.caller._id === authUserId;
                            const isMissed = call.status === "rejected";

                            // Format duration
                            const dur = call.duration || 0;
                            const durText = dur === 0
                                ? null
                                : dur < 60
                                    ? `${dur}s`
                                    : `${Math.floor(dur / 60)}m ${dur % 60}s`;

                            // Format date
                            const callDate = new Date(call.createdAt);
                            const today = new Date();
                            const isToday = callDate.toDateString() === today.toDateString();
                            const dateLabel = isToday
                                ? "Today"
                                : callDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                            return (
                                <div
                                    key={call._id}
                                    className="w-full rounded-2xl flex justify-start items-center p-3 gap-3 transition-all duration-300 border bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 text-white"
                                >
                                    {/* Avatar with type badge */}
                                    <div className="relative flex-shrink-0">
                                        <img
                                            className="h-14 w-14 rounded-2xl object-cover border-2 border-slate-700"
                                            src={getValidImage(otherUser.image)}
                                            alt="img"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700">
                                            {call.type === "voice"
                                                ? <FaPhone className="text-blue-400 text-[9px]" />
                                                : <FaVideo className="text-green-400 text-[9px]" />}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base capitalize tracking-tight truncate">
                                            {otherUser.firstName} {otherUser.lastName}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            {/* Direction arrow */}
                                            <span className={`text-xs font-bold ${isMissed ? "text-red-400" : isOutgoing ? "text-green-400" : "text-blue-400"}`}>
                                                {isOutgoing ? "↗" : "↙"} {isOutgoing ? "Outgoing" : "Incoming"}
                                            </span>
                                            {/* Status */}
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isMissed ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"}`}>
                                                {call.status}
                                            </span>
                                            {/* Duration */}
                                            {durText && (
                                                <span className="text-[10px] text-slate-500 font-medium">· {durText}</span>
                                            )}
                                        </div>
                                        {/* Time + date */}
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            {dateLabel} · {SimpleTime(call.createdAt)}
                                        </p>
                                    </div>

                                    {/* Call back button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartCall(otherUser, call.type);
                                        }}
                                        className="flex-shrink-0 p-2.5 bg-blue-600/10 hover:bg-blue-600/30 text-blue-400 rounded-xl transition-all active:scale-90 border border-blue-500/20"
                                        title={`Call back (${call.type})`}
                                    >
                                        {call.type === "voice" ? <FaPhone size={14} /> : <FaVideo size={14} />}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    const handleStartChat = async (userId) => {
        dispatch(setChatLoading(true));
        const token = localStorage.getItem("token");
        try {
            const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId }),
            });
            
            dispatch(addSelectedChat(json?.data));
            socket.emit("chat created", json?.data, authUserId);
        } catch (err) {
            console.log(err);
        } finally {
            dispatch(setChatLoading(false));
        }
    };

    if (activeSection === "contacts") {
        return (
            <div className="h-full flex flex-col">
                <div className="p-6 w-full font-bold flex justify-between items-center bg-slate-900/50 text-white border-b border-slate-700/50 backdrop-blur-sm">
                    <h1 className="text-2xl tracking-tight capitalize">Contacts</h1>
                </div>
                <div className="flex-1 flex flex-col w-full px-3 gap-2 py-4 overflow-y-auto scroll-style">
                    {contacts.length === 0 && !isChatLoading ? (
                        <div className="flex flex-col items-center justify-center mt-20 text-slate-500">
                            <MdPerson fontSize={48} className="opacity-20 mb-2" />
                            <p>No contacts saved yet.</p>
                        </div>
                    ) : (
                        contacts.map((contact) => (
                            <div
                                key={contact._id}
                                className="w-full h-20 min-h-[80px] rounded-2xl flex justify-start items-center p-3 transition-all duration-300 cursor-pointer border bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 text-white"
                                onClick={() => handleStartChat(contact._id)}
                            >
                                <img
                                    className="h-14 w-14 rounded-2xl object-cover border-2 border-slate-700"
                                    src={getValidImage(contact.image)}
                                    alt="img"
                                />
                                <div className="ml-3">
                                    <h3 className="font-bold text-lg capitalize">{contact.firstName} {contact.lastName}</h3>
                                    <p className="text-xs text-slate-400">{contact.email}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 w-full font-bold flex justify-between items-center bg-slate-900/50 text-white border-b border-slate-700/50 backdrop-blur-sm">
                <h1 className="text-2xl tracking-tight capitalize">{activeSection}s</h1>
                {activeSection === "groups" && (
                    <div
                        className="flex items-center gap-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 py-2 px-3 rounded-xl cursor-pointer hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                        title="Create New Group"
                        onClick={() => dispatch(setGroupChatBox())}
                    >
                        <span className="text-sm font-semibold">New Group</span>
                        <FaPenAlt size={14} />
                    </div>
                )}
            </div>
            <div className="flex-1 flex flex-col w-full px-3 gap-2 py-4 overflow-y-auto scroll-style">
                {filteredChats.length == 0 && isChatLoading ? (
                    <ChatShimmer />
                ) : (
                    <>
                        {filteredChats?.length === 0 && (
                            <div className="w-full h-full flex flex-col justify-center items-center text-slate-500 mt-10">
                                <MdChat fontSize={48} className="mb-2 opacity-20" />
                                <h1 className="text-sm font-medium">
                                    No {activeSection}s yet
                                </h1>
                            </div>
                        )}
                        {filteredChats?.map((chat) => {
                            const isSelected = selectedChat?._id == chat?._id;
                            return (
                                <div
                                    key={chat?._id}
                                    className={`w-full h-20 min-h-[80px] rounded-2xl flex justify-start items-center p-3 transition-all duration-300 cursor-pointer border ${
                                        isSelected
                                            ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-900/40 translate-x-1"
                                            : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 text-white"
                                    }`}
                                    onClick={() => {
                                        dispatch(addSelectedChat(chat));
                                    }}
                                >
                                    <div className="relative">
                                        <img
                                            className="h-14 w-14 rounded-2xl object-cover border-2 border-slate-700"
                                            src={getChatImage(chat, authUserId)}
                                            alt="img"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full shadow-md" />
                                    </div>
                                    <div className="w-full ml-3 overflow-hidden">
                                        <div className="flex justify-between items-center w-full mb-1">
                                            <span className={`line-clamp-1 font-bold text-base capitalize ${isSelected ? "text-white" : "text-slate-100"}`}>
                                                {getChatName(chat, authUserId)}
                                            </span>
                                            <span className={`text-[10px] font-medium whitespace-nowrap ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                                                {chat?.latestMessage &&
                                                    SimpleTime(
                                                        chat?.latestMessage
                                                            ?.createdAt
                                                    )}
                                            </span>
                                        </div>
                                        <div className={`text-sm line-clamp-1 flex items-center gap-1 ${isSelected ? "text-blue-100/80" : "text-slate-400"}`}>
                                            {chat?.latestMessage ? (
                                                <>
                                                    {chat?.latestMessage?.sender?._id === authUserId && (
                                                        <VscCheckAll
                                                            className={isSelected ? "text-white" : "text-blue-400"}
                                                            fontSize={16}
                                                        />
                                                    )}
                                                    <span className="truncate">
                                                        {chat?.latestMessage?.message}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-xs italic opacity-60">
                                                    No messages yet
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyChat;
