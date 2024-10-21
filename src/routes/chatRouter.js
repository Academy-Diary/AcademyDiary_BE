const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const chatController = require("../controllers/chatController.js");


//채팅방 개설하기
router.get("/request", chatController.createRoom);



module.exports = router;