import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiCall } from "../utils/apiHelper";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email) return toast.error("Please enter your email");

        setLoading(true);
        toast.loading("Sending OTP to your email...");

        try {
            await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password`, {
                method: "POST",
                body: JSON.stringify({ email }),
            });

            toast.dismiss();
            toast.success("OTP sent successfully!");
            setStep(2);
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!otp) return toast.error("Please enter the OTP");

        setLoading(true);
        toast.loading("Verifying OTP...");

        try {
            await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-otp`, {
                method: "POST",
                body: JSON.stringify({ email, otp }),
            });

            toast.dismiss();
            toast.success("OTP verified!");
            // Pass email and OTP to the reset password page via state
            navigate("/reset-password", { state: { email, otp } });
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center my-6 text-slate-300 min-h-[80vh]">
            <div className="p-8 w-[90%] sm:w-[70%] md:w-[60%] lg:w-[45%] min-w-72 max-w-[500px] glass-effect rounded-2xl shadow-2xl mt-10 transition-premium border border-white/10">
                <h2 className="text-3xl font-bold text-white w-full text-center mb-8 tracking-tight">
                    {step === 1 ? "Forgot" : "Verify"} <span className="text-blue-500">{step === 1 ? "Password" : "OTP"}</span>
                </h2>
                
                {step === 1 ? (
                    <form className="w-full flex flex-col gap-4">
                        <div>
                            <h3 className="text-xl font-semibold p-1 mb-2">Enter Email</h3>
                            <input
                                className="w-full border border-white/10 py-4 px-8 rounded-xl bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                type="email"
                                placeholder="Registered email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            onClick={handleSendOTP}
                            disabled={loading}
                            className="disabled:opacity-50 disabled:cursor-not-allowed w-full font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-4 mt-6 text-lg shadow-lg shadow-blue-900/20 transition-premium"
                        >
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </form>
                ) : (
                    <form className="w-full flex flex-col gap-4">
                        <div>
                            <h3 className="text-xl font-semibold p-1 mb-2 text-center">Enter 6-Digit OTP</h3>
                            <p className="text-center text-sm text-slate-400 mb-4 font-medium">OTP sent to: <span className="text-blue-400">{email}</span></p>
                            <input
                                className="w-full border border-white/10 py-4 px-8 rounded-xl bg-white/5 text-white text-center text-3xl tracking-[10px] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            onClick={handleVerifyOTP}
                            disabled={loading}
                            className="disabled:opacity-50 disabled:cursor-not-allowed w-full font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-4 mt-6 text-lg shadow-lg shadow-blue-900/20 transition-premium"
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-center text-sm text-blue-400 hover:text-blue-300 mt-2 font-medium"
                        >
                            Change Email
                        </button>
                    </form>
                )}

                <div className="w-full flex items-center mt-8">
                    <div className="w-full h-[1px] bg-white/10"></div>
                    <Link to="/signin" className="px-4 text-sm text-slate-400 hover:text-white transition-colors">
                        Back to Login
                    </Link>
                    <div className="w-full h-[1px] bg-white/10"></div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
