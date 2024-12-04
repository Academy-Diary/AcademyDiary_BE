const express = require("express");
const router = express.Router();
const smsController = require("../controllers/smsController");
const { authenticateJWT } = require("../lib/middlewares/auth.js");


//sms인증요청 (코드발급 & 문자발송)
router.post("/auth/otp", smsController.postOtp);


module.exports = router;