const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const userController = require("../controllers/userController");
const uploadImage = require("../lib/middlewares/uploadImage");

// 회원가입
router.post(`/signup`, userController.createUser);

// 로그인
router.post("/login", userController.createJWT);

// 로그아웃
router.post(
  "/logout",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.removeJWT
);

// 리프레시 토큰을 사용하여 액세스 토큰 갱신
router.post("/refresh-token", userController.refreshToken);

// 아이디 중복 확인
router.get("/check-id/:user_id", userController.checkIdDuplicated);

// 아이디 찾기
router.post("/find-id", userController.findUserId);

// 비밀번호 찾기
router.post("/reset-password", userController.resetUserPassword);

// 회원 탈퇴
router.delete(
  "/:user_id",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.deleteUser
);

// 사용자 이미지 정보 API
router.get(
  "/:user_id/image-info",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.getUserImageInfo
);

// 사용자 정보 API
router.get(
  "/:user_id/basic-info",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.getUserBasicInfo
);

// 사용자 기본 정보 수정 API
router.put(
  "/:user_id/basic-info",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.updateUserBasicInfo
);

// 사용자 이미지 정보 수정 API
router.put(
  "/:user_id/image-info",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  uploadImage.single("file"),
  userController.updateUserImageInfo
);

// 학생 학부모 관계설정 API
router.post("/family", userController.setFamily);

// 보호된 라우트 예시
// router.get("/protected", authenticateJWT, (req, res) => {
//   res.json({ message: "This is a protected route", user: req.user });
// });

module.exports = router;
