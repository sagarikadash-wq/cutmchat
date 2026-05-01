const mongoose = require("mongoose");
require("dotenv").config();

const dropUsernameIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");
        const collection = mongoose.connection.collection("users");
        await collection.dropIndex("username_1");
        console.log("Successfully dropped username_1 index");
    } catch (error) {
        console.error("Error dropping index:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

dropUsernameIndex();
