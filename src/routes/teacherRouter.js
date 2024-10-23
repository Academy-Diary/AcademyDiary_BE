const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateJWT } = require('../lib/middlewares/auth.js');

/**
 * @swagger
 * /teacher/{id}:
 *   delete:
 *     summary: 학원에서 강사 삭제
 *     description: CHIEF 권한을 가진 사용자가 특정 학원의 강사를 삭제합니다.
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 강사의 ID
 *     responses:
 *       200:
 *         description: 강사의 academy_id가 NULL로 설정되고 등록 목록에서 삭제됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 삭제된 강사에 대한 정보
 *       400:
 *         description: 유효한 user_id가 제공되지 않았습니다.
 *       404:
 *         description: 해당 ID에 해당하는 강사를 찾을 수 없습니다.
 *       500:
 *         description: 강사 정보 업데이트 중 서버 오류가 발생했습니다.
 */
router.delete("/:id", authenticateJWT("CHIEF"), teacherController.deleteTeacher);

/**
 * @swagger
 * /teacher/{academy_id}:
 *   get:
 *     summary: 학원의 모든 강사 조회
 *     description: CHIEF 권한을 가진 사용자가 특정 학원의 모든 강사 목록을 조회합니다. 강사의 학원 ID와 사용자 ID는 제외하고 반환됩니다.
 *     tags: [Teacher]
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
 *         description: 강사 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "강사를 성공적으로 불러왔습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     academy_id:
 *                       type: string
 *                       description: 학원의 ID
 *                     role:
 *                       type: string
 *                       description: 강사의 역할 (TEACHER)
 *                     status:
 *                       type: string
 *                       description: 강사의 상태 (APPROVED)
 *                     user:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_name:
 *                             type: string
 *                             description: 강사의 이름
 *                           email:
 *                             type: string
 *                             description: 강사의 이메일
 *                           phone_number:
 *                             type: string
 *                             description: 강사의 전화번호
 *                           lectures:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 lecture_id:
 *                                   type: integer
 *                                   description: 강의 ID
 *                                 lecture_name:
 *                                   type: string
 *                                   description: 강의 이름
 *       403:
 *         description: 학원에 대한 접근 권한이 없습니다.
 *       404:
 *         description: 등록된 강사가 없습니다.
 *       500:
 *         description: 강사 목록을 불러오는 중 서버 오류가 발생했습니다.
 */
router.get("/:academy_id", authenticateJWT("CHIEF"), teacherController.getTeacher);

module.exports = router;