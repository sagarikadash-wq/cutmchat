import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
	setChatLoading,
	setLoading,
	setUserSearchBox,
} from "../../redux/slices/conditionSlice";
import { toast } from "react-toastify";
import ChatShimmer from "../loading/ChatShimmer";
import { addSelectedChat } from "../../redux/slices/myChatSlice";
import { SimpleDateAndTime } from "../../utils/formateDateTime";
import { apiCall } from "../../utils/apiHelper";
import { getValidImage } from "../../utils/getChatName";
import socket from "../../socket/socket";
import { RiUserAddLine } from "react-icons/ri";

const UserSearch = () => {
	const dispatch = useDispatch();
	const isChatLoading = useSelector(
		(store) => store?.condition?.isChatLoading
	);
	const [users, setUsers] = useState([]);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [inputUserName, setInputUserName] = useState("");
	const authUserId = useSelector((store) => store?.auth?._id);

	// All Users Api Call
	useEffect(() => {
		const getAllUsers = async () => {
			dispatch(setChatLoading(true));
			const token = localStorage.getItem("token");
			try {
				const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/user/users`, {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				setUsers(json.data || []);
				setSelectedUsers(json.data || []);
			} catch (err) {
				console.log(err);
			} finally {
				dispatch(setChatLoading(false));
			}
		};
		getAllUsers();
	}, []);

	useEffect(() => {
		setSelectedUsers(
			users.filter((user) => {
				return (
					user.firstName
						.toLowerCase()
						.includes(inputUserName?.toLowerCase()) ||
					user.lastName
						.toLowerCase()
						.includes(inputUserName?.toLowerCase()) ||
					user.email
						.toLowerCase()
						.includes(inputUserName?.toLowerCase())
				);
			})
		);
	}, [inputUserName]);
	const handleSaveContact = async (e, userId) => {
		e.stopPropagation(); // Prevent chat creation when clicking save
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		try {
			const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/user/add-contact`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					userId: userId,
				}),
			});
			if (json.message === "Contact added successfully") {
				toast.success("Contact Saved!");
			} else {
				toast.error(json.message || "Failed to save contact");
			}
		} catch (err) {
			console.log(err);
			toast.error("Error saving contact");
		} finally {
			dispatch(setLoading(false));
		}
	};

	const handleCreateChat = async (userId) => {
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		try {
			const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					userId: userId,
				}),
			});
			dispatch(addSelectedChat(json?.data));
			socket.emit("chat created", json?.data, authUserId);
			toast.success("Created & Selected chat");
			dispatch(setUserSearchBox());
		} catch (err) {
			console.log(err);
			toast.error(err.message);
		} finally {
			dispatch(setLoading(false));
		}
	};
	const [manualEmail, setManualEmail] = useState("");
	const [showManualAdd, setShowManualAdd] = useState(false);

	const handleManualAdd = async () => {
		if (!manualEmail) return toast.error("Please enter an email");
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		try {
			const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/user/add-contact-email`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ email: manualEmail }),
			});
			if (json.message === "Contact added successfully") {
				toast.success("Contact Saved!");
				setManualEmail("");
				setShowManualAdd(false);
			} else {
				toast.error(json.message || "Failed to save contact");
			}
		} catch (err) {
			console.log(err);
			toast.error("Error saving contact");
		} finally {
			dispatch(setLoading(false));
		}
	};

	return (
		<>
			<div className="p-6 w-full h-[12vh] font-semibold flex flex-col justify-center bg-slate-900/60 text-white border-b border-slate-700/50">
				<div className="flex justify-between items-center mb-2">
					<h1 className="text-xl font-bold">Find People</h1>
					<button 
						onClick={() => setShowManualAdd(!showManualAdd)}
						className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all"
					>
						{showManualAdd ? "Back to Search" : "Manual Add"}
					</button>
				</div>
				{!showManualAdd ? (
					<div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700">
						<FaSearch className="text-slate-500 ml-1" />
						<input
							id="search"
							type="text"
							placeholder="Search Users..."
							className="w-full bg-transparent outline-none text-sm"
							onChange={(e) => setInputUserName(e.target?.value)}
						/>
					</div>
				) : (
					<div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-xl border border-blue-500/30">
						<input
							type="email"
							placeholder="Enter email address..."
							className="w-full bg-transparent outline-none text-sm"
							value={manualEmail}
							onChange={(e) => setManualEmail(e.target.value)}
						/>
						<button 
							onClick={handleManualAdd}
							className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-500 transition-all"
						>
							Save
						</button>
					</div>
				)}
			</div>
			<div className="flex flex-col w-full px-4 gap-1 py-2 overflow-y-auto overflow-hidden scroll-style h-[68vh]">
				{selectedUsers.length == 0 && isChatLoading ? (
					<ChatShimmer />
				) : (
					<>
						{selectedUsers?.length === 0 && (
							<div className="w-full h-full flex justify-center items-center text-white">
								<h1 className="text-base font-semibold">
									No users registered.
								</h1>
							</div>
						)}
						{selectedUsers?.map((user) => {
							return (
								<div
									key={user?._id}
									className="w-full h-16 border-slate-500 border rounded-lg flex justify-start items-center p-2 font-semibold gap-2 hover:bg-black/50 transition-all cursor-pointer text-white"
									onClick={() => handleCreateChat(user._id)}
								>
									<img
										className="h-12 min-w-12 rounded-full"
										src={getValidImage(user?.image)}
										alt="img"
									/>
									<div className="w-full">
										<span className="line-clamp-1 capitalize">
											{user?.firstName} {user?.lastName}
										</span>
										<div>
											<span className="text-xs font-light">
												{SimpleDateAndTime(
													user?.createdAt
												)}
											</span>
										</div>
									</div>
									<div 
										className="p-2 hover:bg-blue-600 rounded-full transition-premium group"
										title="Save Contact"
										onClick={(e) => handleSaveContact(e, user._id)}
									>
										<RiUserAddLine className="text-xl text-blue-400 group-hover:text-white" />
									</div>
								</div>
							);
						})}
					</>
				)}
			</div>
		</>
	);
};

export default UserSearch;
