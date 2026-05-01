require("dotenv").config();
const nodemailer = require("nodemailer");

async function test() {
    console.log("Testing with:", process.env.EMAIL_USER);
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log("Connection success!");
    } catch (error) {
        console.error("Connection failed:", error.message);
    }
}

test();
