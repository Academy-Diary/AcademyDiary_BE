const express = require("express");
const router = express.Router();
const smsController = require("../controllers/smsController");
const { authenticateJWT } = require("../lib/middlewares/auth.js");

/**
 * @swagger
 * /sms/otp/request:
 *   post:
 *     summary: OTP 요청
 *     description: 사용자의 전화번호로 OTP를 생성합니다. OTP는 3분 후 만료됩니다.
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: OTP를 생성할 전화번호
 *             example:
 *               phoneNumber: "1234567890"
 *     responses:
 *       200:
 *         description: OTP 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "인증코드가 생성되었습니다."
 *                 otp:
 *                   type: string
 *                   description: "생성된 OTP (실제 환경에서는 제공되지 않음)."
 *       400:
 *         description: 전화번호가 제공되지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 오류 메시지
 *       500:
 *         description: OTP 생성 중 서버 오류 발생
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 오류 메시지
 */
router.post("/otp/request", smsController.requestOtp);

/**
 * @swagger
 * /sms/otp/verify:
 *   post:
 *     summary: OTP 확인
 *     description: 사용자가 제공한 전화번호와 OTP 코드를 검증합니다. IMAP 서버에서 이메일을 확인하고 OTP를 검증합니다.
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: 검증할 전화번호
 *             example:
 *               phoneNumber: "1234567890"
 *     responses:
 *       200:
 *         description: OTP 인증 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "인증 성공!"
 *       400:
 *         description: 인증코드가 유효하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 오류 메시지
 *       404:
 *         description: 새로운 이메일이 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 오류 메시지
 *       500:
 *         description: 서버 오류 (이메일 확인 또는 IMAP 연결 문제)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 오류 메시지
 */
router.post("/otp/verify", smsController.verifyOtp);


module.exports = router;