import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { apiCall } from "../utils/apiHelper";
import { PiEye, PiEyeClosedLight } from "react-icons/pi";

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { email, otp } = location.state || {};
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isShow, setIsShow] = useState(false);

    useEffect(() => {
        if (!email || !otp) {
            toast.error("Please verify OTP first");
            navigate("/forgot-password");
        }
    }, [email, otp, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return toast.error("Passwords do not match");
        if (password.length < 6) return toast.error("Password must be at least 6 characters");

        setLoading(true);
        toast.loading("Updating password...");

        try {
            await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reset-password`, {
                method: "POST",
                body: JSON.stringify({ email, otp, password }),
            });

            toast.dismiss();
            toast.success("Password reset successful!");
            setTimeout(() => navigate("/signin"), 2000);
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center my-6 text-slate-300 min-h-[80vh]">
            <div className="p-8 w-[90%] sm:w-[70%] md:w-[60%] lg:w-[45%] min-w-72 max-w-[500px] glass-effect rounded-2xl shadow-2xl mt-10 transition-premium border border-white/10">
                <h2 className="text-3xl font-bold text-white w-full text-center mb-8 tracking-tight">
                    Set New <span className="text-blue-500">Password</span>
                </h2>
                <form className="w-full flex flex-col gap-4">
                    <div>
                        <h3 className="text-xl font-semibold p-1 mb-2">New Password</h3>
                        <div className="relative">
                            <input
                                className="w-full border border-white/10 py-4 px-8 rounded-xl bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                type={isShow ? "text" : "password"}
                                placeholder="Enter New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span
                                onClick={() => setIsShow(!isShow)}
                                className="cursor-pointer text-slate-400 absolute right-5 top-4"
                            >
                                {isShow ? <PiEyeClosedLight fontSize={22} /> : <PiEye fontSize={22} />}
                            </span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold p-1 mb-2">Confirm Password</h3>
                        <input
                            className="w-full border border-white/10 py-4 px-8 rounded-xl bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="disabled:opacity-50 disabled:cursor-not-allowed w-full font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-4 mt-6 text-lg shadow-lg shadow-blue-900/20 transition-premium"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
