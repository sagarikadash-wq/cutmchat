const express = require("express");
const router = express.Router();
const wrapAsync = require("../middlewares/wrapAsync");
const { authorization } = require("../middlewares/authorization");
const callController = require("../controllers/call");

router.get("/history", authorization, wrapAsync(callController.getCallHistory));
router.post("/log", authorization, wrapAsync(callController.logCall));

module.exports = router;
