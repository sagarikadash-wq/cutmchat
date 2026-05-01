import React, { useState } from "react";
import { MdOutlineClose, MdEdit, MdSave, MdLogout, MdCameraAlt, MdAutoAwesome } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { setProfileDetail, setLoading } from "../redux/slices/conditionSlice";
import { addAuth } from "../redux/slices/authSlice";
import { toast } from "react-toastify";
import { apiCall } from "../utils/apiHelper";
import { getValidImage } from "../utils/getChatName";

// ── Avatar galleries ─────────────────────────────────────────────────────────
const MALE_AVATARS = [
	"https://api.dicebear.com/7.x/avataaars/svg?seed=Mike&style=circle&backgroundColor=c0aede&top=shortHair&facialHairChance=30",
	"https://api.dicebear.com/7.x/avataaars/svg?seed=John&style=circle&backgroundColor=ffd5dc&top=shortHairShortFlat&facialHairChance=50",
	"https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&style=circle&backgroundColor=b6e3f4&top=shortHairSides&facialHairChance=20",
	"https://api.dicebear.com/7.x/avataaars/svg?seed=Bob&style=circle&backgroundColor=d1d4f9&top=shortHairDreads01&facialHairChance=60",
	"https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&style=circle&backgroundColor=c0aede&top=hat&facialHairChance=40",
	"https://api.dicebear.com/7.x/avataaars/svg?seed=Raj&style=circle&backgroundColor=b6e3f4&top=winterHat01&facialHairChance=20",
];
const FEMALE_AVATARS = [
	"https://api.dicebear.com/7.x/avataaars/svg?seed=Sara&style=circle&backgroundColor=b6e3f4&top=longHair&accessoriesChance=40",
	"https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&style=circle&backgroundColor=ffd5dc&top=straightHair&accessoriesChance=50",
	"https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&style=circle&backgroundColor=d1d4f9&top=curly&accessoriesChance=30",
	"https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa&style=circle&backgroundColor=c0aede&top=curvy&accessoriesChance=60",
	"https://api.dicebear.com/7.x/avataaars/svg?seed=Nisha&style=circle&backgroundColor=b6e3f4&top=big&accessoriesChance=40",
	"https://api.dicebear.com/7.x/avataaars/svg?seed=Anya&style=circle&backgroundColor=ffd5dc&top=bob&accessoriesChance=30",
];

const ProfileDetail = () => {
	const dispatch = useDispatch();
	const user = useSelector((store) => store.auth);

	const [isEdit, setIsEdit] = useState(false);
	const [avatarTab, setAvatarTab] = useState(user?.gender === "female" ? "female" : "male");
	const [showAvatarPicker, setShowAvatarPicker] = useState(false);
	const [formData, setFormData] = useState({
		firstName: user.firstName,
		lastName: user.lastName,
		image: getValidImage(user.image),
	});

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (!file) return;
		if (file.size > 2 * 1024 * 1024) return toast.error("File must be under 2MB");
		const reader = new FileReader();
		reader.onloadend = () => setFormData({ ...formData, image: reader.result });
		reader.readAsDataURL(file);
		setShowAvatarPicker(false);
	};

	const handleUpdate = async () => {
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		try {
			const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/user/update-profile`, {
				method: "PUT",
				headers: { Authorization: `Bearer ${token}` },
				body: JSON.stringify(formData),
			});
			if (json.message === "Profile updated successfully") {
				dispatch(addAuth(json.data));
				toast.success("Profile updated!");
				setIsEdit(false);
				setShowAvatarPicker(false);
			} else {
				toast.error(json.message || "Update failed");
			}
		} catch (err) {
			toast.error(err.message || "Error updating profile");
		} finally {
			dispatch(setLoading(false));
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		window.location.reload();
	};

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
			<div className="p-8 w-[90%] sm:w-[520px] bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
				<div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-cyan-400" />

				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<h2 className="text-2xl font-black text-white tracking-tight">My Profile</h2>
					<button onClick={() => dispatch(setProfileDetail())} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
						<MdOutlineClose size={24} />
					</button>
				</div>

				<div className="flex flex-col items-center gap-6">
					{/* Avatar */}
					<div className="relative group">
						<img
							src={formData.image}
							alt="Profile"
							className="w-32 h-32 rounded-3xl object-cover border-4 border-slate-700 shadow-2xl transition-all group-hover:opacity-80"
						/>
						{isEdit && (
							<>
								{/* Camera upload */}
								<label className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-500 p-2 rounded-xl cursor-pointer shadow-lg transition-all" title="Upload photo">
									<MdCameraAlt size={18} className="text-white" />
									<input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
								</label>
								{/* Avatar picker toggle */}
								<button
									onClick={() => setShowAvatarPicker(!showAvatarPicker)}
									className="absolute bottom-1 left-1 bg-purple-600 hover:bg-purple-500 p-2 rounded-xl shadow-lg transition-all"
									title="Choose avatar"
								>
									<MdAutoAwesome size={18} className="text-white" />
								</button>
							</>
						)}
					</div>

					{/* Avatar Picker Panel */}
					{isEdit && showAvatarPicker && (
						<div className="w-full bg-slate-800 rounded-2xl p-4 border border-slate-700">
							<p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Choose Avatar</p>
							{/* Tabs */}
							<div className="flex gap-2 mb-4">
								{["male", "female"].map((tab) => (
									<button
										key={tab}
										onClick={() => setAvatarTab(tab)}
										className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
											avatarTab === tab
												? "bg-blue-600 text-white"
												: "bg-slate-700 text-slate-400 hover:bg-slate-600"
										}`}
									>
										{tab === "male" ? "👦 Male" : "👧 Female"}
									</button>
								))}
							</div>
							{/* Grid */}
							<div className="grid grid-cols-6 gap-2">
								{(avatarTab === "male" ? MALE_AVATARS : FEMALE_AVATARS).map((url, i) => (
									<button
										key={i}
										onClick={() => { setFormData({ ...formData, image: url }); setShowAvatarPicker(false); }}
										className={`rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
											formData.image === url ? "border-blue-500 shadow-lg shadow-blue-900/40" : "border-transparent hover:border-slate-500"
										}`}
									>
										<img src={url} alt={`avatar-${i}`} className="w-full h-full bg-slate-700" />
									</button>
								))}
							</div>
							<p className="text-[11px] text-slate-500 mt-3 text-center">Click an avatar to select it, then save.</p>
						</div>
					)}

					{/* Info / Edit Fields */}
					<div className="w-full space-y-4">
						{!isEdit ? (
							<div className="text-center">
								<h3 className="text-2xl font-bold text-white capitalize">{user.firstName} {user.lastName}</h3>
								<p className="text-slate-400 mt-1 text-sm">{user.email}</p>
								{user.gender && (
									<span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 capitalize">
										{user.gender === "male" ? "👦" : user.gender === "female" ? "👧" : "🧑"} {user.gender}
									</span>
								)}
							</div>
						) : (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1">
										<label className="text-xs font-bold text-blue-400 uppercase tracking-widest ml-1">First Name</label>
										<input
											className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
											value={formData.firstName}
											onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
										/>
									</div>
									<div className="space-y-1">
										<label className="text-xs font-bold text-blue-400 uppercase tracking-widest ml-1">Last Name</label>
										<input
											className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
											value={formData.lastName}
											onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
										/>
									</div>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-bold text-blue-400 uppercase tracking-widest ml-1">Or Paste Image URL</label>
									<input
										className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-colors text-sm"
										value={formData.image}
										onChange={(e) => setFormData({ ...formData, image: e.target.value })}
										placeholder="https://..."
									/>
								</div>
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="flex w-full gap-4 mt-2">
						{!isEdit ? (
							<button
								onClick={() => setIsEdit(true)}
								className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
							>
								<MdEdit size={20} /> Edit Profile
							</button>
						) : (
							<>
								<button
									onClick={() => { setIsEdit(false); setShowAvatarPicker(false); }}
									className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
								>
									Cancel
								</button>
								<button
									onClick={handleUpdate}
									className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/40"
								>
									<MdSave size={20} /> Save Changes
								</button>
							</>
						)}
						<button
							onClick={handleLogout}
							className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold px-6 rounded-2xl transition-all active:scale-95 flex items-center justify-center"
							title="Logout"
						>
							<MdLogout size={20} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProfileDetail;
