const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const chatController = require("../controllers/chatController.js");


//채팅방 개설하기
router.get("/request", chatController.createRoom);

//내가 속한 채팅방 목록 불러오기
router.get("/list", chatController.myChatRoom);

module.exports = router;