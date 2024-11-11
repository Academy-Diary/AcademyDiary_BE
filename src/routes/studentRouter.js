const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const { authenticateJWT } = require("../lib/middlewares/auth.js");

/**
 * @swagger
 * /student:
 *   delete:
 *     summary: 학원에서 학생 삭제
 *     description: CHIEF 권한을 가진 사용자가 특정 학원에서 여러 학생을 삭제합니다. 이 과정에서 해당 학생들의 부모도 학원에서 제외됩니다.
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 삭제할 학생들의 ID 배열
 *             example:
 *               user_id: ["student1", "student2"]
 *     responses:
 *       200:
 *         description: 학생 및 학부모의 academy_id가 NULL로 설정되고, 등록 목록에서 삭제됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 삭제 성공 메시지
 *                   example: "학생/학부모 삭제가 성공적으로 완료되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedUserIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 삭제된 학생 및 부모의 ID 배열
 *                     inputCount:
 *                       type: integer
 *                       description: 입력된 학생 수
 *                     deletedCount:
 *                       type: integer
 *                       description: 실제 삭제된 유저 수
 *                   example:
 *                     deletedUserIds: ["student1", "parent1"]
 *                     inputCount: 2
 *                     deletedCount: 2
 *       400:
 *         description: 유효한 user_id가 제공되지 않았습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "유효한 user_id가 제공되지 않았습니다."
 *       404:
 *         description: 해당 ID에 해당하는 학생을 찾을 수 없습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "해당 ID에 해당하는 학생을 찾을 수 없습니다."
 *       500:
 *         description: 서버 오류가 발생했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류가 발생했습니다."
 */

// 학원에서 학생 삭제
router.delete("/", authenticateJWT("CHIEF"), studentController.deleteStudent);

// studentRouter.js
/**
 * @swagger
 * /student/{academy_id}:
 *   get:
 *     summary: 학원에 등록된 모든 학생 조회
 *     description: CHIEF 권한을 가진 사용자가 특정 학원에 등록된 모든 학생의 이름, 전화번호 및 학부모 정보를 조회합니다.
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
 *                   description: "학생들을 성공적으로 불러왔습니다."
 *                   example: "학생들을 성공적으로 불러왔습니다."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         description: 학생의 ID
 *                         example: "test_student"         
 *                       user_name:
 *                         type: string
 *                         description: 학생의 이름
 *                         example: "춘향이" 
 *                       phone_number:
 *                         type: string
 *                         description: 학생의 전화번호
 *                         example: "010-1234-5678"
 *                       parent:
 *                         type: object
 *                         nullable: true
 *                         description: 학부모 정보 (없을 경우 null)
 *                         properties:
 *                           user_name:
 *                             type: string
 *                             description: 학부모의 이름
 *                             example: "홍길동"
 *                           phone_number:
 *                             type: string
 *                             description: 학부모의 전화번호
 *                             example: "010-1111-2222"   
 *       403:
 *         description: 해당 학원에 대한 접근 권한이 없습니다.
 *       404:
 *         description: 등록된 학생이 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */

// 모든 원생 조회
router.get("/:academy_id", authenticateJWT("CHIEF"), studentController.getStudent);

/**
 * @swagger
 * /student/{user_id}/lecture:
 *   get:
 *     summary: 학생의 수강 중인 강의 조회
 *     description: 특정 학생이 수강 중인 강의 목록을 조회합니다. 각 강의의 요일과 강사 이름도 함께 반환됩니다.
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 학생의 ID
 *     responses:
 *       200:
 *         description: 강의 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "학생이 수강 중인 강의를 성공적으로 불러왔습니다."
 *                 lectures:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lecture_id:
 *                         type: integer
 *                         description: 강의 ID
 *                       lecture_name:
 *                         type: string
 *                         description: 강의 이름
 *                       start_time:
 *                         type: string
 *                         format: time
 *                         description: 강의 시작 시간
 *                       end_time:
 *                         type: string
 *                         format: time
 *                         description: 강의 종료 시간
 *                       days:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 강의가 진행되는 요일
 *                       teacher:
 *                         type: object
 *                         properties:
 *                           user_name:
 *                             type: string
 *                             description: 강사의 이름
 *       400:
 *         description: 유효한 user_id가 제공되지 않았습니다.
 *       404:
 *         description: 해당 학생의 수강 중인 강의를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
// 학생이 듣는 강의 내역 조회
router.get(
  "/:user_id/lecture",
  authenticateJWT("CHIEF", "STUDENT", "TEACHER", "PARENT"),
  studentController.getStudentLecture
);

module.exports = router;
