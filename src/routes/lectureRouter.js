const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const lectureController = require("../controllers/lectureController.js");

//학원내의 모든 강의 조회
router.get("/", authenticateJWT, lectureController.getLecture);

//강의 생성
router.post("/", authenticateJWT, lectureController.createLecture);

//강의 수정
router.put("/:lecture_id", authenticateJWT, lectureController.modifyLecture);

//강의 삭제
router.delete("/:lecture_id", authenticateJWT, lectureController.deleteLecture);

// 시험 유형 생성
router.post(
  "/:lecture_id/exam-type",
  authenticateJWT,
  lectureController.createExamType
);

// 시험 유형 조회
router.get(
  "/:lecture_id/exam-type",
  authenticateJWT,
  lectureController.getExamType
);

// 시험 유형 삭제
router.delete(
  "/:lecture_id/:exam_type_id(\\d+)",
  authenticateJWT,
  lectureController.deleteExamType
);

//강의 수강생 조회
router.get("/:lecture_id/student", authenticateJWT, lectureController.getLectureStudent);

//강의 수강생 추가
router.post("/:lecture_id/student", authenticateJWT, lectureController.createLectureStudent);

//강의 수강생 제거
router.delete("/:lecture_id/student", authenticateJWT, lectureController.deleteLectureStudent);

// 시험 생성
router.post(
  "/:lecture_id/exam",
  authenticateJWT,
  lectureController.createExam
);

module.exports = router;