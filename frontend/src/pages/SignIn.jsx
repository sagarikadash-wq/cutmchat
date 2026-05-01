import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { addAuth } from "../redux/slices/authSlice";
import { apiCall } from "../utils/apiHelper";
import { checkValidSignInFrom } from "../utils/validate";
import { PiEye, PiEyeClosedLight } from "react-icons/pi";

const SignIn = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [load, setLoad] = useState("");
	const [isShow, setIsShow] = useState(false);
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const logInUser = async (e) => {
		// SignIn ---
		toast.loading("Wait until you SignIn");
		e.target.disabled = true;

		try {
			const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signin`, {
				method: "POST",
				body: JSON.stringify({
					email: email,
					password: password,
				}),
			});

			setLoad("");
			e.target.disabled = false;
			toast.dismiss();
			
			localStorage.setItem("token", json.token);
			dispatch(addAuth(json.data));
			navigate("/");
			toast.success(json?.message || "Signed in successfully");
		} catch (error) {
			console.error("Error:", error);
			setLoad("");
			toast.dismiss();
			toast.error("Error : " + (error.message || "Network Error"));
			e.target.disabled = false;
		}
	};
	const handleLogin = (e) => {
		if (email && password) {
			const validError = checkValidSignInFrom(email, password);
			if (validError) {
				toast.error(validError);
				return;
			}
			setLoad("Loading...");
			logInUser(e);
		} else {
			toast.error("Required: All Fields");
		}
	};
	return (
		<div className="flex flex-col items-center my-6 text-slate-300 min-h-[80vh]">
			<div className="p-8 w-[90%] sm:w-[70%] md:w-[60%] lg:w-[45%] min-w-72 max-w-[500px] glass-effect rounded-2xl shadow-2xl mt-10 transition-premium border border-white/10">
				<h2 className="text-3xl font-bold text-white w-full text-center mb-8 tracking-tight">
					SignIn <span className="text-blue-500">CutmChat App</span>
				</h2>
				<form className="w-full flex justify-between flex-col">
					<h3 className="text-xl font-semibold p-1">
						Enter Email Address
					</h3>
					<input
						className="w-full border border-white/10 my-3 py-4 px-8 rounded-xl flex justify-between bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
						type="email"
						placeholder="Enter Email Address"
						name="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<h3 className="text-xl font-semibold p-1">
						Enter Password
					</h3>
					<div className="relative">
						<input
							className="w-full border border-white/10 my-3 py-4 px-8 rounded-xl flex justify-between bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
							type={isShow ? "text" : "password"}
							placeholder="Enter Password"
							name="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<span
							onClick={() => setIsShow(!isShow)}
							className="cursor-pointer text-black/80 absolute right-5 top-8"
						>
							{isShow ? (
								<PiEyeClosedLight fontSize={22} />
							) : (
								<PiEye fontSize={22} />
							)}
						</span>
					</div>
					<button
						onClick={(e) => {
							e.preventDefault();
							handleLogin(e);
						}}
						className="disabled:opacity-50 disabled:cursor-not-allowed w-full font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-4 mt-8 text-lg shadow-lg shadow-blue-900/20 transition-premium"
					>
						{load == "" ? "SignIn" : load}
					</button>
					<div className="w-full flex items-center mt-3">
						<div className="w-full h-[1px] bg-slate-600"></div>
						<Link to="/forgot-password">
							<div className="p-3 font-semibold text-md hover:text-white whitespace-nowrap">
								Forgot Password
							</div>
						</Link>
						<div className="w-full h-[1px] bg-slate-600"></div>
					</div>
					<div className="w-full flex items-center my-3">
						<div className="w-full h-[1px] bg-slate-600"></div>
						<Link to="/signup">
							<div className="p-3 font-semibold text-md hover:text-white">
								SignUp
							</div>
						</Link>
						<div className="w-full h-[1px] bg-slate-600"></div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SignIn;
