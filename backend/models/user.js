const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		gender: {
			type: String,
			enum: ["male", "female", "other"],
			default: "other",
		},
		image: {
			type: String,
			default: "https://api.dicebear.com/7.x/avataaars/svg?seed=Avatar",
		},
		contacts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		resetPasswordToken: String,
		resetPasswordExpires: Date,
		resetPasswordOTP: String,
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model("User", userSchema);
module.exports = User;
