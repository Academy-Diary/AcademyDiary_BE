const express = require("express");
const router = express.Router();
const registerController = require("../controllers/registerationController");
const { authenticateJWT } = require("../lib/middlewares/auth.js");

/**
 * @swagger
 * tags:
 *   name: Registration
 *   description: 학원 및 사용자 등록 관련 API
 */

/**
 * @swagger
 * /registeration/request/academy:
 *   post:
 *     summary: 학원 등록 요청
 *     tags: [Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               academy_id:
 *                 type: string
 *               academy_name:
 *                 type: string
 *               academy_email:
 *                 type: string
 *               address:
 *                 type: string
 *               phone_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: 학원 등록이 성공적으로 완료됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     academy_id:
 *                       type: string
 *                     academy_name:
 *                       type: string
 *                     academy_email:
 *                       type: string
 *                     address:
 *                       type: string
 *                     phone_number:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [PENDING]
 *             example:
 *               message: "학원 등록이 성공적으로 완료되었습니다."
 *               data:
 *                 academy_id: "academy123"
 *                 academy_name: "Best Academy"
 *                 academy_email: "info@bestacademy.com"
 *                 address: "123 Main St"
 *                 phone_number: "123-456-7890"
 *                 status: "PENDING"
 *       409:
 *         description: 중복된 학원 ID나 이메일
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "이미 존재하는 학원 ID나 이메일입니다."
 *       500:
 *         description: 학원 등록 중 서버 오류 발생
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "학원 등록 중 오류가 발생했습니다."
 */
// 학원 등록 요청
router.post(
  "/request/academy",
  authenticateJWT("CHIEF"),
  registerController.registerAcademy
);
/**
 * @swagger
 * /registeration/request/user:
 *   post:
 *     summary: 사용자 등록 요청
 *     tags: [Registration]
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
 *                 type: string
 *               academy_key:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [TEACHER, STUDENT, PARENT]
 *     responses:
 *       201:
 *         description: 사용자 등록 요청이 성공적으로 완료됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     academy_id:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [TEACHER, STUDENT, PARENT]
 *                     status:
 *                       type: string
 *                       enum: [PENDING]
 *                     parent_id:
 *                       type: string
 *                       nullable: true
 *             example:
 *               message: "등록요청이 성공적으로 완료되었습니다."
 *               data:
 *                 user_id: "user123"
 *                 academy_id: "academy123"
 *                 role: "STUDENT"
 *                 status: "PENDING"
 *                 parent_id: "parent123"
 *       404:
 *         description: 학원 또는 사용자 정보가 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "해당하는 유저가 존재하지 않습니다. 또는 역할이 잘못되었습니다."
 *       500:
 *         description: 사용자 등록 중 서버 오류 발생
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "사용자 등록 요청 중 오류가 발생했습니다."
 */
// 사용자의 학원 등록 요청
router.post(
  "/request/user",
  authenticateJWT("TEACHER", "STUDENT", "PARENT"),
  registerController.registerUser
);
/**
 * @swagger
 * /registeration/decide/user:
 *   post:
 *     summary: 사용자 승인/거절 처리
 *     tags: [Registration]
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
 *                 description: 승인 또는 거절할 유저의 ID 배열
 *               agreed:
 *                 type: boolean
 *                 description: 승인(true) 또는 거절(false)
 *     responses:
 *       200:
 *         description: 사용자 승인/거절이 성공적으로 완료됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "유저 승인/거절이 성공적으로 완료되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedUserIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 업데이트된 유저 ID 배열
 *                     inputCount: 
 *                       type: integer 
 *                       description: 프론트에서 요청된(선택한) 유저 수
 *                     updatedCount:
 *                       type: integer
 *                       description: 상태가 변경된 유저 수
 *                     status:
 *                       type: string
 *                       enum: [APPROVED, REJECTED]
 *                       description: 승인 또는 거절 상태
 *             example:
 *               message: "유저 승인/거절이 성공적으로 완료되었습니다."
 *               data:
 *                 updatedUserIds: ["test_student", "test_teacher", "test_parent"]
 *                 inputCount: 2
 *                 updatedCount: 3
 *                 status: "APPROVED"
 *       404:
 *         description: 사용자 정보를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "해당하는 유저가 존재하지 않습니다."
 *       500:
 *         description: 서버 오류 발생
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "사용자 승인/거절 처리 중 오류가 발생했습니다."
 */
router.post(
  "/decide/user",
  authenticateJWT("CHIEF"),
  registerController.decideUserStatus
);

/**
 * @swagger
 * /registeration/list/user:
 *   get:
 *     summary: 사용자 목록 조회 (PENDING 상태)
 *     tags: [Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [TEACHER, STUDENT]
 *       - in: query
 *         name: academy_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공적으로 사용자 목록을 불러옴
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     academy_id:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [TEACHER, STUDENT]
 *                     formattedResult:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               user_id:
 *                                 type: string
 *                               user_name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               phone_number:
 *                                 type: string
 *                               parent:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   user_id:
 *                                     type: string
 *                                   user_name:
 *                                     type: string
 *             example:
 *               message: "성공적으로 STUDENT 목록을 불러왔습니다."
 *               data:
 *                 academy_id: "academy123"
 *                 role: "STUDENT"
 *                 formattedResult:
 *                   - status: "PENDING"
 *                     user:
 *                       user_id: "student123"
 *                       user_name: "John Doe"
 *                       email: "john@example.com"
 *                       phone_number: "123-456-7890"
 *                       parent:
 *                         user_id: "parent123"
 *                         user_name: "Jane Doe"
 *       404:
 *         description: 조건에 맞는 사용자가 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "해당 조건에 맞는 사용자가 없습니다."
 */
// 사용자의 학원 등록 요청리스트 조회
router.get(
  "/list/user",
  authenticateJWT("CHIEF", "TEACHER"),
  registerController.listUser
);
/**
 * @swagger
 * /registeration/list/academy:
 *   get:
 *     summary: PENDING 상태의 학원 목록 조회
 *     tags: [Registration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공적으로 학원 목록을 불러옴
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       academy_id:
 *                         type: string
 *                       academy_name:
 *                         type: string
 *                       academy_email:
 *                         type: string
 *             example:
 *               data:
 *                 - academy_id: "academy123"
 *                   academy_name: "Best Academy"
 *                   academy_email: "info@bestacademy.com"
 *       404:
 *         description: 조건에 맞는 학원이 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "해당 조건에 맞는 학원이 없습니다."
 */
// 학원 등록 요청리스트 조회
router.get(
  "/list/academy",
  authenticateJWT("ADMIN"),
  registerController.listAcademy
);

module.exports = router;
