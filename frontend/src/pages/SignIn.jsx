import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { addAuth } from "../redux/slices/authSlice";
import { apiCall } from "../utils/apiHelper";
import { checkValidSignInFrom } from "../utils/validate";
import { PiEye, PiEyeClosedLight } from "react-icons/pi";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

if (!BASE_URL) {
  console.warn("⚠️ VITE_BACKEND_URL is not set. API calls will fail.");
}

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // FIX: boolean state instead of string
  const [isShow, setIsShow] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toastIdRef = useRef(null); // FIX: track toast id for cleanup

  // FIX: cleanup toast on unmount to avoid memory leak
  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);

  const logInUser = async () => {
    toastIdRef.current = toast.loading("Signing you in..."); // FIX: store toast id
    setLoading(true);

    try {
      const json = await apiCall(`${BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // FIX: explicit header
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      toast.dismiss(toastIdRef.current); // FIX: dismiss by id
      toastIdRef.current = null;

      localStorage.setItem("token", json.token);
      dispatch(addAuth(json.data));

      // FIX: toast before navigate so it fires on mounted component
      toast.success(json?.message || "Signed in successfully");
      navigate("/");
    } catch (error) {
      console.error("SignIn Error:", error);
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
      toast.error("Error: " + (error.message || "Network Error"));
    } finally {
      setLoading(false); // FIX: always reset in finally
    }
  };

  const handleLogin = () => {
    if (!email || !password) {
      toast.error("Required: All Fields");
      return;
    }
    const validError = checkValidSignInFrom(email, password);
    if (validError) {
      toast.error(validError);
      return;
    }
    logInUser();
  };

  return (
    <div className="flex flex-col items-center my-6 text-slate-300 min-h-[80vh]">
      <div className="p-8 w-[90%] sm:w-[70%] md:w-[60%] lg:w-[45%] min-w-72 max-w-[500px] glass-effect rounded-2xl shadow-2xl mt-10 transition-premium border border-white/10">
        <h2 className="text-3xl font-bold text-white w-full text-center mb-8 tracking-tight">
          SignIn <span className="text-blue-500">CutmChat App</span>
        </h2>
        <form className="w-full flex justify-between flex-col">
          <h3 className="text-xl font-semibold p-1">Enter Email Address</h3>
          <input
            className="w-full border border-white/10 my-3 py-4 px-8 rounded-xl flex justify-between bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            type="email"
            placeholder="Enter Email Address"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <h3 className="text-xl font-semibold p-1">Enter Password</h3>
          <div className="relative">
            <input
              className="w-full border border-white/10 my-3 py-4 px-8 rounded-xl flex justify-between bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              type={isShow ? "text" : "password"}
              placeholder="Enter Password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()} // BONUS: Enter key support
            />
            <span
              onClick={() => setIsShow(!isShow)}
              className="cursor-pointer text-slate-400 absolute right-5 top-8" // FIX: was text-black/80 (invisible on dark bg)
            >
              {isShow ? (
                <PiEyeClosedLight fontSize={22} />
              ) : (
                <PiEye fontSize={22} />
              )}
            </span>
          </div>
          <button
            type="button" // FIX: explicit type to prevent accidental form submit
            onClick={handleLogin} // FIX: removed redundant e.preventDefault wrapper
            disabled={loading}
            className="disabled:opacity-50 disabled:cursor-not-allowed w-full font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-4 mt-8 text-lg shadow-lg shadow-blue-900/20 transition-premium"
          >
            {loading ? "Loading..." : "SignIn"}
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
