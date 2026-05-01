const User = require("../models/user");

const getAuthUser = async (req, res) => {
	if (!req.user) {
		return res.status(404).json({ message: `User Not Found` });
	}
	res.status(200).json({
		data: req.user,
	});
};

const getAllUsers = async (req, res) => {
	const allUsers = await User.find({ _id: { $ne: req.user._id } })
		.select("-password")
		.sort({ _id: -1 });
	res.status(200).send({ data: allUsers });
};

const addContact = async (req, res) => {
	const { userId } = req.body;
	if (!userId) {
		return res.status(400).json({ message: "UserId is required" });
	}

	const user = await User.findById(req.user._id);
	if (user.contacts.includes(userId)) {
		return res.status(400).json({ message: "Contact already exists" });
	}

	user.contacts.push(userId);
	await user.save();

	res.status(200).json({ message: "Contact added successfully" });
};

const addContactByEmail = async (req, res) => {
	const { email } = req.body;
	if (!email) {
		return res.status(400).json({ message: "Email is required" });
	}

	const contactUser = await User.findOne({ email: email.toLowerCase() });
	if (!contactUser) {
		return res.status(404).json({ message: "User with this email not found" });
	}

	if (contactUser._id.toString() === req.user._id.toString()) {
		return res.status(400).json({ message: "You cannot add yourself as a contact" });
	}

	const user = await User.findById(req.user._id);
	if (user.contacts.includes(contactUser._id)) {
		return res.status(400).json({ message: "Contact already exists" });
	}

	user.contacts.push(contactUser._id);
	await user.save();

	res.status(200).json({ 
		message: "Contact added successfully",
		data: {
			_id: contactUser._id,
			firstName: contactUser.firstName,
			lastName: contactUser.lastName,
			image: contactUser.image
		}
	});
};

const getContacts = async (req, res) => {
	const user = await User.findById(req.user._id).populate("contacts", "-password");
	res.status(200).json({ data: user.contacts });
};

const updateProfile = async (req, res) => {
	const { firstName, lastName, image } = req.body;
	const user = await User.findById(req.user._id);
	if (!user) {
		return res.status(404).json({ message: "User not found" });
	}

	if (firstName) user.firstName = firstName;
	if (lastName) user.lastName = lastName;
	if (image) user.image = image;

	await user.save();
	user.password = null;

	res.status(200).json({ 
		message: "Profile updated successfully",
		data: user
	});
};

module.exports = { getAuthUser, getAllUsers, addContact, getContacts, addContactByEmail, updateProfile };
