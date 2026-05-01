import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { addAuth } from "../redux/slices/authSlice";
import { PiEye, PiEyeClosedLight } from "react-icons/pi";

const SignIn = () => {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const navigate = useNavigate();
	const dispatch = useDispatch();

	// ✅ Handle Input Change
	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// ✅ Validate Inputs
	const validateForm = () => {
		const { email, password } = formData;

		if (!email || !password) {
			toast.error("All fields are required");
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			toast.error("Invalid email format");
			return false;
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters");
			return false;
		}

		return true;
	};

	// ✅ API CALL (Enterprise Standard)
	const loginUser = async () => {
		if (!validateForm()) return;

		setLoading(true);
		const toastId = toast.loading("Signing in...");

		try {
			const response = await fetch(
				`${import.meta.env.VITE_BACKEND_URL}/signin`, // ✅ FIXED URL
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formData),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Login failed");
			}

			// ✅ Store Token Securely
			if (data?.token) {
				localStorage.setItem("token", data.token);
			}

			// ✅ Redux Update
			if (data?.data) {
				dispatch(addAuth(data.data));
			}

			toast.update(toastId, {
				render: "Login successful 🎉",
				type: "success",
				isLoading: false,
				autoClose: 2000,
			});

			navigate("/");
		} catch (error) {
			toast.update(toastId, {
				render: error.message || "Something went wrong",
				type: "error",
				isLoading: false,
				autoClose: 3000,
			});
		} finally {
			setLoading(false);
		}
	};

	// ✅ Handle Submit
	const handleSubmit = (e) => {
		e.preventDefault();
		loginUser();
	};

	return (
		<div className="flex flex-col items-center my-6 text-slate-300 min-h-[80vh]">
			<div className="p-8 w-[90%] sm:w-[70%] md:w-[60%] lg:w-[45%] max-w-[500px] glass-effect rounded-2xl shadow-2xl mt-10 border border-white/10">
				
				<h2 className="text-3xl font-bold text-white text-center mb-8">
					Sign In <span className="text-blue-500">CutmChat</span>
				</h2>

				<form onSubmit={handleSubmit} className="flex flex-col">

					<label className="font-semibold">Email Address</label>
					<input
						type="email"
						name="email"
						value={formData.email}
						onChange={handleChange}
						placeholder="Enter email"
						className="input-style"
					/>

					<label className="font-semibold mt-4">Password</label>
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							name="password"
							value={formData.password}
							onChange={handleChange}
							placeholder="Enter password"
							className="input-style"
						/>

						<span
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-4 top-4 cursor-pointer text-gray-400"
						>
							{showPassword ? (
								<PiEyeClosedLight size={22} />
							) : (
								<PiEye size={22} />
							)}
						</span>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="mt-6 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold disabled:opacity-50"
					>
						{loading ? "Signing In..." : "Sign In"}
					</button>

					<div className="flex justify-between mt-4 text-sm">
						<Link to="/forgot-password" className="hover:text-white">
							Forgot Password?
						</Link>

						<Link to="/signup" className="hover:text-white">
							Create Account
						</Link>
					</div>

				</form>
			</div>
		</div>
	);
};

export default SignIn;
