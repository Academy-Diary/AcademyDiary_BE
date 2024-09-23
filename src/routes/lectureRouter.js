const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const lectureController = require("../controllers/lectureController.js");

//학원내의 모든 강의 조회
router.get("/", authenticateJWT("CHIEF"), lectureController.getLecture);

//강의 생성
router.post("/", authenticateJWT("CHIEF", "TEACHER"), lectureController.createLecture);

//강의 수정
router.put("/:lecture_id", authenticateJWT("CHIEF", "TEACHER"), lectureController.modifyLecture);

//강의 삭제
router.delete("/:lecture_id", authenticateJWT("CHIEF", "TEACHER"), lectureController.deleteLecture);

// 시험 유형 생성
router.post(
  "/:lecture_id/exam-type",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.createExamType
);

// 시험 유형 조회
router.get(
  "/:lecture_id/exam-type",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.getExamType
);

// 시험 유형 삭제
router.delete(
  "/:lecture_id/:exam_type_id(\\d+)",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.deleteExamType
);

//강의 수강생 조회
router.get("/:lecture_id/student", authenticateJWT("CHIEF", "TEACHER"), lectureController.getLectureStudent);

//강의 수강생 추가
router.post("/:lecture_id/student", authenticateJWT("CHIEF", "TEACHER"), lectureController.createLectureStudent);

//강의 수강생 제거
router.delete("/:lecture_id/student", authenticateJWT("CHIEF", "TEACHER"), lectureController.deleteLectureStudent);

// 시험 생성
router.post(
  "/:lecture_id/exam",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.createExam
);

// 시험 조회
router.get(
  "/:lecture_id/exam",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.getExam
);

// 시험 삭제
router.delete(
  "/:lecture_id/exam/:exam_id(\\d+)",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.deleteExam
);

module.exports = router;