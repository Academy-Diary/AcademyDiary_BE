const express = require("express");
const {authenticateJWT} = require("../lib/middlewares/auth.js")
const router = express.Router();
const userController = require("../controllers/userController");

// 회원가입
router.post(`/signup`, userController.createUser);

// 로그인
router.post("/login", userController.createJWT);

// 로그아웃
router.post("/logout", userController.removeJWT);

// 보호된 라우트 예시
// router.get("/protected", authenticateJWT, (req, res) => {
//   res.json({ message: "This is a protected route", user: req.user });
// });

module.exports = router;
