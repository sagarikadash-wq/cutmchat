const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

const allowedOrigins = [
	process.env.FRONTEND_URL,
	"http://localhost:5173",
	"http://localhost:5174",
	"http://localhost:3000",
].filter(Boolean); // Remove any undefined values

const corsOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (mobile apps, curl, Postman)
		if (!origin) return callback(null, true);
		if (allowedOrigins.includes(origin)) {
			return callback(null, true);
		} else {
			console.warn("CORS blocked origin:", origin);
			return callback(new Error("Not allowed by CORS"));
		}
	},
	methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
	optionsSuccessStatus: 200,
};

app.options("*", cors(corsOptions)); // Handle preflight for all routes
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// All routers
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const messageRouter = require("./routes/message");
const callRouter = require("./routes/call");
const Call = require("./models/call");

require("dns").setServers(["8.8.8.8", "8.8.4.4"]);

// Connect to Database
main()
	.then(() => console.log("Database Connection established"))
	.catch((err) => {
		console.error("Database Connection Error:", err);
		process.exit(1);
	});

async function main() {
	await mongoose.connect(process.env.MONGODB_URI, {
		serverSelectionTimeoutMS: 5000,
	});
}

// Root route
app.get("/", (req, res) => {
	res.json({
		message: "Welcome to Chat Application!",
		frontend_url: process.env.FRONTEND_URL,
	});
});

// All routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/call", callRouter);

// Invaild routes
app.all("*", (req, res) => {
	res.json({ error: "Invaild Route" });
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error("Backend Error:", err);
	const status = err.status || 500;
	const errorMessage = err.message || "Something Went Wrong!";
	res.status(status).json({ message: errorMessage });
});

// Start the server
const server = app.listen(PORT, async () => {
	console.log(`Server listening on ${PORT}`);
});

// Socket.IO setup
const { Server } = require("socket.io");
const io = new Server(server, {
	pingTimeout: 60000,
	transports: ["websocket"],
	cors: corsOptions,
});

// Socket connection
io.on("connection", (socket) => {
	console.log("Connected to socket.io:", socket.id);

	// Join user and message send to client
	const setupHandler = (userId) => {
		if (!socket.hasJoined) {
			socket.join(userId);
			socket.hasJoined = true;
			console.log("User joined:", userId);
			socket.emit("connected");
		}
	};
	const newMessageHandler = (newMessageReceived) => {
		let chat = newMessageReceived?.chat;
		chat?.users.forEach((user) => {
			if (user._id === newMessageReceived.sender._id) return;
			console.log("Message received by:", user._id);
			socket.in(user._id).emit("message received", newMessageReceived);
		});
	};

	// Join a Chat Room and Typing effect
	const joinChatHandler = (room) => {
		if (socket.currentRoom) {
			if (socket.currentRoom === room) {
				console.log(`User already in Room: ${room}`);
				return;
			}
			socket.leave(socket.currentRoom);
			console.log(`User left Room: ${socket.currentRoom}`);
		}
		socket.join(room);
		socket.currentRoom = room;
		console.log("User joined Room:", room);
	};
	const typingHandler = (room) => {
		socket.in(room).emit("typing");
	};
	const stopTypingHandler = (room) => {
		socket.in(room).emit("stop typing");
	};

	// Clear, Delete and Create chat handlers
	const clearChatHandler = (chatId) => {
		socket.in(chatId).emit("clear chat", chatId);
	};
	const deleteChatHandler = (chat, authUserId) => {
		chat.users.forEach((user) => {
			if (authUserId === user._id) return;
			console.log("Chat delete:", user._id);
			socket.in(user._id).emit("delete chat", chat._id);
		});
	};
	const chatCreateChatHandler = (chat, authUserId) => {
		chat.users.forEach((user) => {
			if (authUserId === user._id) return;
			console.log("Create chat:", user._id);
			socket.in(user._id).emit("chat created", chat);
		});
	};

	const deleteMessageHandler = ({ messageId, chatId }) => {
		socket.in(chatId).emit("message deleted", { messageId });
	};

	// Call Handlers — server-side logging for reliability
	const callUserHandler = ({ userToCall, signalData, from, name, callType, image }) => {
		io.to(userToCall).emit("incoming call", { signal: signalData, from, name, callType, image });
	};
	const answerCallHandler = ({ to, signal }) => {
		io.to(to).emit("call accepted", signal);
	};
	// reject: receiver sends callerId (the person who called them) and own id
	const rejectCallHandler = ({ to, callerId, receiverId, type }) => {
		if (callerId && receiverId) {
			Call.create({ caller: callerId, receiver: receiverId, type: type || "voice", status: "rejected", duration: 0 })
				.catch(e => console.error("Call log error (reject):", e));
		}
		io.to(to).emit("call rejected");
	};
	// end: whichever side ends the call sends full metadata
	const endCallHandler = ({ to, callerId, receiverId, type, duration }) => {
		if (callerId && receiverId) {
			Call.create({ caller: callerId, receiver: receiverId, type: type || "voice", status: "ended", duration: duration || 0 })
				.catch(e => console.error("Call log error (end):", e));
		}
		io.to(to).emit("call ended");
	};
	const iceCandidateHandler = ({ to, candidate }) => {
		io.to(to).emit("ice-candidate", candidate);
	};
	const missedCallHandler = ({ to, callerId, receiverId, type }) => {
		if (callerId && receiverId) {
			Call.create({ caller: callerId, receiver: receiverId, type: type || "voice", status: "missed", duration: 0 })
				.catch(e => console.error("Call log error (missed):", e));
		}
		io.to(to).emit("call missed");
	};

	socket.on("setup", setupHandler);
	socket.on("new message", newMessageHandler);
	socket.on("join chat", joinChatHandler);
	socket.on("typing", typingHandler);
	socket.on("stop typing", stopTypingHandler);
	socket.on("clear chat", clearChatHandler);
	socket.on("delete chat", deleteChatHandler);
	socket.on("chat created", chatCreateChatHandler);
	socket.on("delete message", deleteMessageHandler);
	socket.on("call user", callUserHandler);
	socket.on("answer call", answerCallHandler);
	socket.on("reject call", rejectCallHandler);
	socket.on("end call", endCallHandler);
	socket.on("ice-candidate", iceCandidateHandler);
	socket.on("missed call", missedCallHandler);

	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
		socket.off("setup", setupHandler);
		socket.off("new message", newMessageHandler);
		socket.off("join chat", joinChatHandler);
		socket.off("typing", typingHandler);
		socket.off("stop typing", stopTypingHandler);
		socket.off("clear chat", clearChatHandler);
		socket.off("delete chat", deleteChatHandler);
		socket.off("chat created", chatCreateChatHandler);
	});
});
