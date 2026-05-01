const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { generateToken } = require("../config/jwtProvider");
const { sendEmail } = require("../config/emailConfig");

const registerUser = async (req, res, next) => {
	let { firstName, lastName, email, password, gender } = req.body;
	const existingUser = await User.findOne({ email: email });
	if (existingUser) {
		return res.status(400).json({ message: `User Already Exist` });
	}
	password = bcrypt.hashSync(password, 8);

	// Auto-assign avatar based on gender using DiceBear API
	const seed = encodeURIComponent(`${firstName}${lastName}`);
	let image;
	if (gender === "female") {
		image = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&style=circle&backgroundColor=b6e3f4&top=longHair,straightHair,curly,curvy&accessoriesChance=40`;
	} else if (gender === "male") {
		image = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&style=circle&backgroundColor=c0aede&top=shortHair,shortHairShortFlat,shortHairSides&facialHairChance=30`;
	} else {
		image = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&style=circle&backgroundColor=d1d4f9`;
	}

	const userData = new User({
		firstName,
		lastName,
		email,
		password,
		gender: gender || "other",
		image,
	});
	const user = await userData.save();
	const jwt = generateToken(user._id);
	res.status(200).json({
		message: "Registration Successfully",
		token: jwt,
	});
};

const loginUser = async (req, res) => {
	let { email, password } = req.body;
	let user = await User.findOne({ email: email });
	if (!user) {
		return res.status(404).json({ message: `User Not Found` });
	}
	const isPasswordValid = bcrypt.compareSync(password, user.password);
	if (!isPasswordValid) {
		return res.status(401).json({ message: "Invalid Password" });
	}
	const jwt = generateToken(user._id);
	user.password = null;
	res.status(200).json({
		message: "Login Successfully",
		data: user,
		token: jwt,
	});
};
const forgotPassword = async (req, res) => {
	const { email } = req.body;
	const user = await User.findOne({ email });

	if (!user) {
		return res.status(404).json({ message: "User not found with this email" });
	}

	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	user.resetPasswordOTP = otp;
	user.resetPasswordExpires = Date.now() + 600000; // 10 minutes

	await user.save();

	const subject = "Password Reset OTP - CutmChat App";
	const text = `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`;
	const html = `
		<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
			<h2 style="color: #2563eb;">Password Reset OTP</h2>
			<p>You requested a password reset for your CutmChat App account.</p>
			<div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
				${otp}
			</div>
			<p>This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
			<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
			<p style="font-size: 12px; color: #6b7280;">Sent by CutmChat App</p>
		</div>
	`;

	try {
		await sendEmail(email, subject, text, html);
		res.status(200).json({ message: "OTP sent to your email" });
	} catch (error) {
		res.status(500).json({ message: "Failed to send email. Check your SMTP settings." });
	}
};

const verifyOTP = async (req, res) => {
	const { email, otp } = req.body;

	const user = await User.findOne({
		email,
		resetPasswordOTP: otp,
		resetPasswordExpires: { $gt: Date.now() },
	});

	if (!user) {
		return res.status(400).json({ message: "Invalid or expired OTP" });
	}

	res.status(200).json({ message: "OTP verified successfully" });
};

const resetPassword = async (req, res) => {
	const { email, otp, password } = req.body;

	const user = await User.findOne({
		email,
		resetPasswordOTP: otp,
		resetPasswordExpires: { $gt: Date.now() },
	});

	if (!user) {
		return res.status(400).json({ message: "Invalid or expired OTP session" });
	}

	user.password = bcrypt.hashSync(password, 8);
	user.resetPasswordOTP = undefined;
	user.resetPasswordExpires = undefined;

	await user.save();

	res.status(200).json({ message: "Password reset successful" });
};

module.exports = { registerUser, loginUser, forgotPassword, verifyOTP, resetPassword };

