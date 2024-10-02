const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const examTypeController = require("../controllers/examTypeController.js");

// 시험 유형 생성
router.post(
  "/",
  authenticateJWT("CHIEF", "TEACHER"),
  examTypeController.createExamType
);

// 시험 유형 조회
router.get(
  "/academy/:academy_id",
  authenticateJWT("CHIEF", "TEACHER", "STUDENT", "PARENT"),
  examTypeController.getExamType
);

// 시험 유형 삭제
router.delete(
  "/:exam_type_id(\\d+)",
  authenticateJWT("CHIEF", "TEACHER"),
  examTypeController.deleteExamType
);

module.exports = router;