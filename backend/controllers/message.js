const Chat = require("../models/chat");
const Message = require("../models/message");

const createMessage = async (req, res) => {
	const { message, chatId, mediaType, mediaUrl } = req.body;
	if (message || mediaUrl) {
		const newMessage = await Message.create({
			sender: req.user._id,
			message: message,
			chat: chatId,
			mediaType: mediaType || "text",
			mediaUrl: mediaUrl,
		});
		const chat = await Chat.findByIdAndUpdate(chatId, {
			latestMessage: newMessage._id,
		});
		const fullMessage = await Message.findById(newMessage._id)
			.populate("sender", "-password")
			.populate({
				path: "chat",
				populate: { path: "users groupAdmin", select: "-password" },
			});
		return res.status(201).json({ data: fullMessage });
	} else {
		return res.status(400).json({ message: "Message not provide" });
	}
};

const allMessage = async (req, res) => {
	const chatId = req.params.chatId;
	const messages = await Message.find({ chat: chatId })
		.populate("sender", "-password")
		.populate("chat");
	return res.status(200).json({ data: messages });
};
const clearChat = async (req, res) => {
	const chatId = req.params.chatId;
	await Message.deleteMany({ chat: chatId });
	return res.status(200).json({ message: "success" });
};

const deleteMessage = async (req, res) => {
	const messageId = req.params.messageId;
	const message = await Message.findById(messageId).populate("chat");
	if (!message) {
		return res.status(404).json({ message: "Message not found" });
	}
	
	// Check if user is the sender OR a participant in the chat
	const isParticipant = message.chat.users.some(u => u.toString() === req.user._id.toString());
	
	if (message.sender.toString() !== req.user._id.toString() && !isParticipant) {
		return res.status(403).json({ message: "You are not authorized to delete this message" });
	}

	await Message.deleteOne({ _id: messageId });
	return res.status(200).json({ message: "success" });
};

module.exports = { createMessage, allMessage, clearChat, deleteMessage };
