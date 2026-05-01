const express = require("express");
const router = express.Router();
const userControllers = require("../controllers/user");
const wrapAsync = require("../middlewares/wrapAsync");
const { authorization } = require("../middlewares/authorization");

router.get("/profile", authorization, wrapAsync(userControllers.getAuthUser));
router.get("/users", authorization, wrapAsync(userControllers.getAllUsers));
router.post("/add-contact", authorization, wrapAsync(userControllers.addContact));
router.post("/add-contact-email", authorization, wrapAsync(userControllers.addContactByEmail));
router.get("/contacts", authorization, wrapAsync(userControllers.getContacts));
router.put("/update-profile", authorization, wrapAsync(userControllers.updateProfile));

module.exports = router;
