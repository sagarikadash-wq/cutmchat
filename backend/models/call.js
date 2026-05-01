const mongoose = require("mongoose");

const CallSchema = new mongoose.Schema(
    {
        caller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["voice", "video"],
            required: true,
        },
        status: {
            type: String,
            enum: ["missed", "ended", "rejected"],
            default: "ended",
        },
        duration: {
            type: Number,
            default: 0, // in seconds
        },
    },
    { timestamps: true }
);

const Call = mongoose.model("Call", CallSchema);
module.exports = Call;
