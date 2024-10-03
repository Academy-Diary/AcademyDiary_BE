const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const { authenticateJWT } = require("../lib/middlewares/auth.js");

// 학원에서 학생 삭제
router.delete("/:user_id", authenticateJWT("CHIEF"), studentController.deleteStudent);

/**
 * @swagger
 * /student/{academy_id}:
 *   get:
 *     summary: 학원에 등록된 모든 학생 조회
 *     description: CHIEF 권한을 가진 사용자가 특정 학원에 등록된 모든 학생을 조회합니다.
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: academy_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 학원의 ID
 *     responses:
 *       200:
 *         description: 학생 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "학생를 성공적으로 불러왔습니다."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         description: 학생의 ID
 *                       academy_id:
 *                         type: string
 *                         description: 학원의 ID
 *                       status:
 *                         type: string
 *                         description: 학생의 등록 상태
 *       403:
 *         description: 해당 학원에 대한 접근 권한이 없습니다.
 *       404:
 *         description: 등록된 학생이 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
// 모든 원생 조회
router.get("/:academy_id", authenticateJWT("CHIEF"), studentController.getStudent);

// 학생이 듣는 강의 내역 조회
router.get(
  "/:user_id/lecture",
  authenticateJWT,
  studentController.getStudentLecture
);

module.exports = router;
