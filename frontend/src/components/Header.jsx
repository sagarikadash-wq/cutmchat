import React, { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/cutm_logo.jpg";
import { useDispatch, useSelector } from "react-redux";
import { addAuth } from "../redux/slices/authSlice";
import { apiCall } from "../utils/apiHelper";
import handleScrollTop from "../utils/handleScrollTop";
import {
	MdKeyboardArrowDown,
	MdKeyboardArrowUp,
	MdNotificationsActive,
} from "react-icons/md";
import {
	setHeaderMenu,
	setLoading,
	setNotificationBox,
	setProfileDetail,
} from "../redux/slices/conditionSlice";
import { IoLogOutOutline } from "react-icons/io5";
import { PiUserCircleLight } from "react-icons/pi";

const Header = () => {
	const user = useSelector((store) => store.auth);
	const isHeaderMenu = useSelector((store) => store?.condition?.isHeaderMenu);
	const newMessageRecieved = useSelector(
		(store) => store?.myChat?.newMessageRecieved
	);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const token = localStorage.getItem("token");

	const getAuthUser = async (token) => {
		dispatch(setLoading(true));
		try {
			const json = await apiCall(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			dispatch(addAuth(json.data));
		} catch (err) {
			console.log(err);
		} finally {
			dispatch(setLoading(false));
		}
	};

	useEffect(() => {
		const publicRoutes = ["/signup", "/forgot-password", "/reset-password"];
		const isPublicRoute = publicRoutes.includes(pathname);

		if (token && token !== "undefined" && token !== "") {
			if (!user) {
				getAuthUser(token);
			}
			if (pathname === "/signin") {
				navigate("/");
			}
		} else if (!isPublicRoute && pathname !== "/signin") {
			navigate("/signin");
		}
		dispatch(setHeaderMenu(false));
		handleScrollTop();
	}, [token, navigate, pathname, user]);

	const handleLogout = () => {
		localStorage.removeItem("token");
		window.location.reload();
		navigate("/signin");
	};

	useEffect(() => {
		var prevScrollPos = window.pageYOffset;
		const handleScroll = () => {
			var currentScrollPos = window.pageYOffset;
			if (prevScrollPos < currentScrollPos && currentScrollPos > 80) {
				document.getElementById("header").classList.add("hiddenbox");
			} else {
				document.getElementById("header").classList.remove("hiddenbox");
			}
			prevScrollPos = currentScrollPos;
		};
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const headerMenuBox = useRef(null);
	const headerUserBox = useRef(null);
	// headerMenuBox outside click handler
	const handleClickOutside = (event) => {
		if (
			headerMenuBox.current &&
			!headerUserBox?.current?.contains(event.target) &&
			!headerMenuBox.current.contains(event.target)
		) {
			dispatch(setHeaderMenu(false));
		}
	};

	// add && remove events according to isHeaderMenu
	useEffect(() => {
		if (isHeaderMenu) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isHeaderMenu]);
	return (
		<div
			id="header"
			className="w-full h-16 fixed top-0 z-50 md:h-20 glass-effect shadow-lg flex justify-between items-center p-4 font-semibold text-white transition-premium"
		>
			<div className="flex items-center justify-start gap-2">
				<Link to={"/"} className="hover:scale-105 transition-transform">
					<img
						src={Logo}
						alt="CutmChat"
						className="h-10 w-10 md:h-12 md:w-12 rounded-lg shadow-inner border border-white/20"
					/>
				</Link>
				<Link to={"/"}>
					<span className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
						CutmChat App
					</span>
				</Link>
			</div>

			{!user && (
				<Link to={"/signin"}>
					<button className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg transition-all active:scale-95">
						SignIn
					</button>
				</Link>
			)}
		</div>
	);
};

export default Header;
