import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { checkValidSignUpFrom } from "../utils/validate";
import { PiEye, PiEyeClosedLight } from "react-icons/pi";
import { apiCall } from "../utils/apiHelper";
import { MdMale, MdFemale, MdPerson } from "react-icons/md";

// DiceBear preview URLs per gender
const AVATAR_PREVIEW = {
	male:   "https://api.dicebear.com/7.x/avataaars/svg?seed=MaleDemo&style=circle&backgroundColor=c0aede&top=shortHair,shortHairShortFlat&facialHairChance=30",
	female: "https://api.dicebear.com/7.x/avataaars/svg?seed=FemaleDemo&style=circle&backgroundColor=b6e3f4&top=longHair,straightHair,curly",
	other:  "https://api.dicebear.com/7.x/avataaars/svg?seed=OtherDemo&style=circle&backgroundColor=d1d4f9",
};

const SignUp = () => {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName]   = useState("");
	const [email, setEmail]         = useState("");
	const [password, setPassword]   = useState("");
	const [gender, setGender]       = useState(""); // male | female | other
	const [load, setLoad]           = useState("");
	const [isShow, setIsShow]       = useState(false);
	const navigate = useNavigate();

	const signUpUser = async (e) => {
		toast.loading("Creating your account…");
		e.target.disabled = true;
		try {
			const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, {
				method: "POST",
				body: JSON.stringify({ firstName, lastName, email, password, gender }),
			});
			setLoad("");
			e.target.disabled = false;
			toast.dismiss();
			navigate("/signin");
			toast.success(json?.message || "Signed up successfully!");
		} catch (error) {
			console.error("Error:", error);
			setLoad("");
			toast.dismiss();
			toast.error("Error: " + (error.message || "Network Error"));
			e.target.disabled = false;
		}
	};

	const handleSignup = (e) => {
		if (!gender) { toast.error("Please select your gender"); return; }
		if (firstName && lastName && email && password) {
			const validError = checkValidSignUpFrom(firstName, lastName, email, password);
			if (validError) { toast.error(validError); return; }
			setLoad("Loading...");
			signUpUser(e);
		} else {
			toast.error("All fields are required");
		}
	};

	const avatarSrc = gender ? AVATAR_PREVIEW[gender] : null;

	return (
		<div className="flex flex-col items-center my-6 text-slate-300 min-h-[80vh]">
			<div className="p-8 w-[90%] sm:w-[70%] md:w-[60%] lg:w-[45%] min-w-72 max-w-[520px] glass-effect rounded-2xl shadow-2xl mt-10 border border-white/10">
				<h2 className="text-3xl font-bold text-white w-full text-center mb-2 tracking-tight">
					Create Account
				</h2>
				<p className="text-slate-400 text-sm text-center mb-8">Join <span className="text-blue-400 font-semibold">CutmChat</span></p>

				{/* Avatar Preview */}
				{avatarSrc && (
					<div className="flex justify-center mb-6">
						<div className="relative">
							<img
								src={avatarSrc}
								alt="Your avatar"
								className="w-24 h-24 rounded-2xl border-4 border-blue-500/40 shadow-xl bg-slate-800"
							/>
							<div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
								Auto
							</div>
						</div>
					</div>
				)}

				{/* Gender Selector */}
				<div className="mb-6">
					<label className="text-xs font-bold text-blue-400 uppercase tracking-widest ml-1 mb-3 block">
						Select Gender <span className="text-red-400">*</span>
					</label>
					<div className="grid grid-cols-3 gap-3">
						{[
							{ val: "male",   label: "Male",   icon: <MdMale size={28}/>,   color: "blue" },
							{ val: "female", label: "Female", icon: <MdFemale size={28}/>, color: "pink" },
							{ val: "other",  label: "Other",  icon: <MdPerson size={28}/>, color: "purple" },
						].map(({ val, label, icon, color }) => (
							<button
								key={val}
								type="button"
								onClick={() => setGender(val)}
								className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all font-semibold text-sm ${
									gender === val
										? color === "blue"   ? "bg-blue-600/20 border-blue-500 text-blue-400"
										: color === "pink"   ? "bg-pink-600/20 border-pink-500 text-pink-400"
										:                      "bg-purple-600/20 border-purple-500 text-purple-400"
										: "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500"
								}`}
							>
								{icon}
								{label}
							</button>
						))}
					</div>
				</div>

				<form className="w-full flex flex-col gap-4">
					{/* Name row */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs font-bold text-blue-400 uppercase tracking-widest ml-1 mb-1 block">First Name</label>
							<input
								className="w-full border border-slate-700 py-3 px-4 rounded-xl bg-slate-800/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all"
								type="text" placeholder="First name" value={firstName}
								onChange={(e) => setFirstName(e.target.value)} required
							/>
						</div>
						<div>
							<label className="text-xs font-bold text-blue-400 uppercase tracking-widest ml-1 mb-1 block">Last Name</label>
							<input
								className="w-full border border-slate-700 py-3 px-4 rounded-xl bg-slate-800/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all"
								type="text" placeholder="Last name" value={lastName}
								onChange={(e) => setLastName(e.target.value)} required
							/>
						</div>
					</div>

					{/* Email */}
					<div>
						<label className="text-xs font-bold text-blue-400 uppercase tracking-widest ml-1 mb-1 block">Email Address</label>
						<input
							className="w-full border border-slate-700 py-3 px-4 rounded-xl bg-slate-800/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all"
							type="email" placeholder="you@email.com" value={email}
							onChange={(e) => setEmail(e.target.value)} required
						/>
					</div>

					{/* Password */}
					<div>
						<label className="text-xs font-bold text-blue-400 uppercase tracking-widest ml-1 mb-1 block">Password</label>
						<div className="relative">
							<input
								className="w-full border border-slate-700 py-3 px-4 rounded-xl bg-slate-800/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all pr-12"
								type={isShow ? "text" : "password"} placeholder="Create a strong password"
								value={password} onChange={(e) => setPassword(e.target.value)}
							/>
							<span onClick={() => setIsShow(!isShow)} className="cursor-pointer text-slate-400 hover:text-white absolute right-4 top-3.5 transition-colors">
								{isShow ? <PiEyeClosedLight fontSize={22} /> : <PiEye fontSize={22} />}
							</span>
						</div>
					</div>

					<button
						onClick={(e) => { handleSignup(e); e.preventDefault(); }}
						className="disabled:opacity-50 disabled:cursor-not-allowed w-full font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-4 mt-2 text-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95"
					>
						{load === "" ? "Create Account" : load}
					</button>

					<div className="w-full flex items-center gap-3 my-1">
						<div className="flex-1 h-px bg-slate-700" />
						<Link to="/signin" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Sign In</Link>
						<div className="flex-1 h-px bg-slate-700" />
					</div>
				</form>
			</div>
		</div>
	);
};

export default SignUp;
