const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const examTypeController = require("../controllers/examTypeController.js");


/**
 * @swagger
 * /exam-type:
 *   post:
 *     summary: 시험 유형 생성
 *     description: 특정 학원에서 새로운 시험 유형을 생성합니다. 시험 유형 이름이 이미 존재하는 경우 오류가 발생합니다.
 *     tags: [ExamType]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - academy_id
 *               - exam_type_name
 *             properties:
 *               academy_id:
 *                 type: string
 *                 description: 시험 유형을 생성할 학원의 ID
 *               exam_type_name:
 *                 type: string
 *                 description: 생성할 시험 유형의 이름
 *     responses:
 *       201:
 *         description: 시험 유형 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 시험 유형이 성공적으로 생성되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     exam_type_id:
 *                       type: integer
 *                       description: 생성된 시험 유형의 ID
 *                     academy_id:
 *                       type: string
 *                       description: 학원의 ID
 *                     exam_type_name:
 *                       type: string
 *                       description: 시험 유형의 이름
 *       400:
 *         description: 입력 데이터가 잘못되었거나, 시험 유형 이름이 이미 존재합니다.
 *       403:
 *         description: 다른 학원의 시험 유형 생성은 금지됩니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
// 시험 유형 생성
router.post(
  "/",
  authenticateJWT("CHIEF", "TEACHER"),
  examTypeController.createExamType
);

/**
 * @swagger
 * /exam-type/academy/{academy_id}:
 *   get:
 *     summary: 학원의 시험 유형 조회
 *     description: CHIEF, TEACHER, STUDENT, PARENT 권한을 가진 사용자가 특정 학원의 시험 유형을 조회합니다. 요청한 사용자가 학원에 소속되지 않은 경우 접근이 제한됩니다. `exam_type_name` Query Parameter를 사용해 특정 이름을 포함하는 시험 유형을 필터링할 수 있습니다.
 *     tags: [ExamType]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: academy_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 학원의 ID
 *       - in: query
 *         name: exam_type_name
 *         required: false
 *         schema:
 *           type: string
 *         description: 특정 이름을 포함하는 시험 유형 필터링 (부분 일치)
 *     responses:
 *       200:
 *         description: 시험 유형 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                   example: "시험 유형을 성공적으로 불러왔습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     academy_id:
 *                       type: string
 *                       description: 학원의 ID
 *                       example: "1234-5678-9012"
 *                     type_cnt:
 *                       type: integer
 *                       description: 개설된 시험 유형의 수
 *                       example: 2
 *                     exam_types:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           exam_type_name:
 *                             type: string
 *                             description: 시험 유형의 이름
 *                             example: "중간고사"
 *                           exam_type_id:
 *                             type: integer
 *                             description: 시험 유형의 ID
 *                             example: 1
 *       403:
 *         description: 다른 학원에 접근할 수 없습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 접근 제한 메시지
 *                   example: "다른 학원에는 접근할 수 없습니다."
 *       404:
 *         description: 개설된 시험 유형이 존재하지 않습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 데이터가 없을 때의 메시지
 *                   example: "현재 개설된 시험 유형이 존재하지 않습니다."
 *       500:
 *         description: 서버 오류가 발생했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 서버 에러 메시지
 *                   example: "서버에서 오류가 발생했습니다."
 */

// 시험 유형 조회
router.get(
  "/academy/:academy_id",
  authenticateJWT("CHIEF", "TEACHER", "STUDENT", "PARENT"),
  examTypeController.getExamType
);

/**
 * @swagger
 * /exam-type/{exam_type_id}:
 *   delete:
 *     summary: 시험 유형 삭제
 *     description: CHIEF 또는 TEACHER 권한을 가진 사용자가 특정 학원의 시험 유형을 삭제합니다. 학원 ID가 일치하지 않으면 접근이 제한됩니다.
 *     tags: [ExamType]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exam_type_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 시험 유형의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - academy_id
 *             properties:
 *               academy_id:
 *                 type: string
 *                 description: 학원의 ID
 *     responses:
 *       200:
 *         description: 시험 유형 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "시험 유형 삭제가 완료되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     exam_type_id:
 *                       type: integer
 *                       description: 삭제된 시험 유형의 ID
 *                     exam_type_name:
 *                       type: string
 *                       description: 삭제된 시험 유형의 이름
 *       400:
 *         description: 유효하지 않은 exam_type_id 또는 잘못된 요청
 *       403:
 *         description: 다른 학원에 접근할 수 없습니다.
 *       404:
 *         description: 삭제할 시험 유형을 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
// 시험 유형 삭제
router.delete(
  "/:exam_type_id(\\d+)",
  authenticateJWT("CHIEF", "TEACHER"),
  examTypeController.deleteExamType
);

module.exports = router;