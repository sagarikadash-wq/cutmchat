import React from "react";
import { FaPenAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
	return (
		<div className="w-full min-h-48 glass-effect shadow-inner flex flex-col justify-between items-start px-8 py-12 text-slate-300 border-t border-white/10 mt-auto">
			<div className="flex flex-col md:flex-row items-start justify-between w-full gap-8 mb-8">
				<div className="flex flex-col max-w-sm">
					<h1 className="font-bold text-2xl text-white mb-4 flex items-center gap-2">
						<span>CutmChat App</span>
						<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
					</h1>
					<p className="text-sm leading-relaxed mb-4">
						A professional real-time communication platform built for the next generation of enterprise collaboration.
					</p>
					<div className="flex flex-col text-sm space-y-1">
						<span className="font-semibold text-white">Centurion University of Technology and Management</span>
						<span>Village Alluri Nagar, P.O. - Sitapur</span>
						<span>Paralakhemundi, Gajapati, Odisha - 761211</span>
					</div>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 gap-8 w-full md:w-auto">
					<div className="flex flex-col space-y-3">
						<h1 className="font-bold text-white uppercase text-xs tracking-widest">Navigation</h1>
						<Link className="hover:text-blue-400 transition-colors text-sm" to={"/"}>Home</Link>
						<Link className="hover:text-blue-400 transition-colors text-sm" to={"/signin"}>Sign In</Link>
						<Link className="hover:text-blue-400 transition-colors text-sm" to={"/signup"}>Sign Up</Link>
					</div>

					<div className="flex flex-col space-y-3">
						<h1 className="font-bold text-white uppercase text-xs tracking-widest">Connect</h1>
						<a className="hover:text-blue-400 transition-colors text-sm" href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
						<a className="hover:text-blue-400 transition-colors text-sm" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
						<a className="hover:text-blue-400 transition-colors text-sm" href="mailto:support@cutmchat.com" target="_blank" rel="noreferrer">Email Support</a>
					</div>

					<div className="flex flex-col space-y-3">
						<h1 className="font-bold text-white uppercase text-xs tracking-widest">Developer</h1>
						<span className="text-sm italic text-blue-300">Created & Developed by</span>
						<span className="font-bold text-white text-lg tracking-tight">Sagarika Dash</span>
					</div>
				</div>
			</div>

			<div className="w-full border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs uppercase tracking-widest">
				<p>&copy; 2026 CutmChat App. All rights reserved.</p>
				<p>Centurion University &bull; Sagarika Dash</p>
			</div>
		</div>
	);
};

export default Footer;
