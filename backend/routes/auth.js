const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/auth");
const wrapAsync = require("../middlewares/wrapAsync");

router.post("/signup", wrapAsync(authControllers.registerUser));
router.post("/signin", wrapAsync(authControllers.loginUser));
router.post("/forgot-password", wrapAsync(authControllers.forgotPassword));
router.post("/verify-otp", wrapAsync(authControllers.verifyOTP));
router.post("/reset-password", wrapAsync(authControllers.resetPassword));

module.exports = router;
