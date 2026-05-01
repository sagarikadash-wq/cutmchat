const express = require("express");
const router = express.Router();
const wrapAsync = require("../middlewares/wrapAsync");
const { authorization } = require("../middlewares/authorization");
const messageController = require("../controllers/message");

router.post("/", authorization, wrapAsync(messageController.createMessage));
router.get("/:chatId", authorization, wrapAsync(messageController.allMessage));
router.delete("/clear/:chatId", authorization, wrapAsync(messageController.clearChat));
router.delete("/:messageId", authorization, wrapAsync(messageController.deleteMessage));

module.exports = router;
