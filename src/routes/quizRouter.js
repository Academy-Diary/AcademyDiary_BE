const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const quizController = require("../controllers/quizController.js");

// 퀴즈 생성
router.post(
  "/create",
  authenticateJWT("CHIEF", "TEACHER"),
  quizController.createQuiz
);

module.exports = router;
