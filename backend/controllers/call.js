const Call = require("../models/call");

const getCallHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const calls = await Call.find({
            $or: [{ caller: userId }, { receiver: userId }],
        })
            .populate("caller", "firstName lastName image email")
            .populate("receiver", "firstName lastName image email")
            .sort({ createdAt: -1 });

        res.status(200).json({ data: calls });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const logCall = async (req, res) => {
    try {
        const { callerId, receiverId, type, status, duration } = req.body;
        const currentUserId = req.user._id;

        const newCall = new Call({
            caller: callerId || currentUserId,
            receiver: receiverId,
            type,
            status,
            duration,
        });

        const savedCall = await newCall.save();
        const populatedCall = await Call.findById(savedCall._id)
            .populate("caller", "firstName lastName image email")
            .populate("receiver", "firstName lastName image email");

        res.status(201).json({ data: populatedCall });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCallHistory, logCall };
