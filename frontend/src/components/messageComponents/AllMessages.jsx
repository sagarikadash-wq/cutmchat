import React, { Fragment, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { VscCheckAll } from "react-icons/vsc";
import { CgChevronDoubleDown } from "react-icons/cg";
import { CiMenuKebab } from "react-icons/ci";
import { toast } from "react-toastify";
import { apiCall } from "../../utils/apiHelper";
import socket from "../../socket/socket";
import { deleteMessage } from "../../redux/slices/messageSlice";
import {
    SimpleDateAndTime,
    SimpleDateMonthDay,
    SimpleTime,
} from "../../utils/formateDateTime";
import { getValidImage } from "../../utils/getChatName";

const AllMessages = ({ allMessage }) => {
    const dispatch = useDispatch();
    const chatBox = useRef();
    const adminId = useSelector((store) => store.auth?._id);
    const isTyping = useSelector((store) => store?.condition?.isTyping);
    const [activeMenuId, setActiveMenuId] = useState(null);

    const handleDeleteMessage = async (messageId) => {
        const token = localStorage.getItem("token");
        try {
            const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/message/${messageId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            if (json.message === "success") {
                dispatch(deleteMessage(messageId));
                socket.emit("delete message", { messageId, chatId: allMessage[0]?.chat?._id });
                toast.success("Message deleted");
            } else {
                toast.error(json.message || "Failed to delete message");
            }
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to delete message");
        }
    };

    // Socket listener for individual message deletion
    useEffect(() => {
        const handleDeleteSocket = ({ messageId }) => {
            dispatch(deleteMessage(messageId));
        };
        socket.on("message deleted", handleDeleteSocket);
        return () => socket.off("message deleted", handleDeleteSocket);
    }, [dispatch]);


    const [scrollShow, setScrollShow] = useState(true);
    // Handle Chat Box Scroll Down
    const handleScrollDownChat = () => {
        if (chatBox.current) {
            chatBox.current.scrollTo({
                top: chatBox.current.scrollHeight,
                // behavior: "auto",
            });
        }
    };
    // Scroll Button Hidden
    useEffect(() => {
        handleScrollDownChat();
        if (chatBox.current.scrollHeight == chatBox.current.clientHeight) {
            setScrollShow(false);
        }
        const handleScroll = () => {
            const currentScrollPos = chatBox.current.scrollTop;
            if (
                currentScrollPos + chatBox.current.clientHeight <
                chatBox.current.scrollHeight - 30
            ) {
                setScrollShow(true);
            } else {
                setScrollShow(false);
            }
        };
        const chatBoxCurrent = chatBox.current;
        chatBoxCurrent.addEventListener("scroll", handleScroll);
        return () => {
            chatBoxCurrent.removeEventListener("scroll", handleScroll);
        };
    }, [allMessage, isTyping]);

    return (
        <>
            {scrollShow && (
                <div
                    className="absolute bottom-16 right-4 cursor-pointer z-20 font-light text-white/50 bg-black/80 hover:bg-black hover:text-white p-1.5 rounded-full"
                    onClick={handleScrollDownChat}
                >
                    <CgChevronDoubleDown title="Scroll Down" fontSize={24} />
                </div>
            )}
            <div
                className="flex flex-col w-full px-3 gap-1 py-2 overflow-y-auto overflow-hidden scroll-style h-[66vh]"
                ref={chatBox}
            >
                {allMessage?.length > 0 && (
                    <div className="w-full flex flex-col items-center my-6 opacity-60">
                        <div className="w-16 h-16 rounded-2xl glass-effect flex items-center justify-center mb-3 shadow-2xl">
                            <span className="text-3xl">🛡️</span>
                        </div>
                        <p className="text-xs text-blue-400 uppercase tracking-[0.2em] font-bold">Secure Chat History Started</p>
                        <div className="w-px h-8 bg-gradient-to-b from-blue-500/50 to-transparent mt-2"></div>
                    </div>
                )}
                {allMessage?.map((message, idx) => {
                    return (
                        <Fragment key={message._id}>
                            <div className="sticky top-0 flex w-full justify-center z-10">
                                {new Date(
                                    allMessage[idx - 1]?.updatedAt
                                ).toDateString() !==
                                    new Date(
                                        message?.updatedAt
                                    ).toDateString() && (
                                    <span className="text-xs font-light mb-2 mt-1 text-white/50 bg-black h-7 w-fit px-5 rounded-md flex items-center justify-center cursor-pointer">
                                        {SimpleDateMonthDay(message?.updatedAt)}
                                    </span>
                                )}
                            </div>
                            <div
                                className={`flex items-start gap-1 ${
                                    message?.sender?._id === adminId
                                        ? "flex-row-reverse text-white"
                                        : "flex-row text-black"
                                }`}
                            >
                                {message?.chat?.isGroupChat &&
                                    message?.sender?._id !== adminId &&
                                    (allMessage[idx + 1]?.sender?._id !==
                                    message?.sender?._id ? (
                                        <img
                                            src={getValidImage(message?.sender?.image)}
                                            alt=""
                                            className="h-9 w-9 rounded-full"
                                        />
                                    ) : (
                                        <div className="h-9 w-9 rounded-full"></div>
                                    ))}
                                <div
                                    className={`${
                                        message?.sender?._id === adminId
                                            ? "bg-gradient-to-tr to-slate-800 from-green-400 rounded-s-lg rounded-ee-2xl"
                                            : "bg-gradient-to-tr to-slate-800 from-white rounded-e-lg rounded-es-2xl shadow-lg"
                                    } py-1.5 px-2 min-w-10 text-start flex flex-col relative max-w-[85%] group`}
                                >
                                    {message?.chat?.isGroupChat &&
                                        message?.sender?._id !== adminId && (
                                            <span className="text-xs font-bold text-start text-green-900">
                                                {message?.sender?.firstName}
                                            </span>
                                        )}
                                    <div
                                        className={`mt-1 pb-1.5 ${
                                            message?.sender?._id == adminId
                                                ? "pr-16"
                                                : "pr-12"
                                        }`}
                                    >
                                        {message?.mediaType === "image" && (
                                            <img 
                                                src={message?.mediaUrl} 
                                                alt="shared" 
                                                className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity" 
                                                onClick={() => window.open(message?.mediaUrl, '_blank')}
                                            />
                                        )}
                                        {message?.message && (
                                            <span className="">
                                                {message?.message}
                                            </span>
                                        )}
                                        
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <CiMenuKebab 
                                                className={`cursor-pointer hover:text-white ${message?.sender?._id === adminId ? "text-white/50" : "text-black/40 hover:text-black"}`} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(activeMenuId === message._id ? null : message._id);
                                                }}
                                            />
                                            {activeMenuId === message._id && (
                                                <div className={`absolute ${message?.sender?._id === adminId ? 'right-0' : 'left-0'} top-6 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden min-w-[100px] animate-in fade-in slide-in-from-top-2`}>
                                                    <button 
                                                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-slate-800 transition-colors"
                                                        onClick={() => handleDeleteMessage(message._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <span
                                            className={`text-[11px] font-light absolute bottom-1 right-2 flex items-end gap-1.5 ${message?.sender?._id === adminId ? "text-white/70" : "text-black/50"}`}
                                            title={SimpleDateAndTime(
                                                message?.updatedAt
                                            )}
                                        >
                                            {SimpleTime(message?.updatedAt)}
                                            {message?.sender?._id ===
                                                adminId && (
                                                <VscCheckAll
                                                    color="white"
                                                    fontSize={14}
                                                />
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Fragment>
                    );
                })}
                {isTyping && (
                    <div id="typing-animation">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                )}
            </div>
        </>
    );
};

export default AllMessages;
