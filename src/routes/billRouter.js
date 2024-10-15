const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const billController = require("../controllers/billController.js");


/**
 * @swagger
 * /bill:
 *   post:
 *     summary: Bill 생성
 *     description: 여러 학생과 수업에 대한 Bill을 생성하고, 각 수업의 비용을 합산하여 청구 금액을 계산합니다. 트랜잭션을 사용하여 작업이 모두 성공했을 때만 커밋됩니다.
 *     tags: [Bill]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - class_id
 *               - deadline
 *             properties:
 *               user_id:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Bill을 발행할 학생들의 user_id 목록
 *               class_id:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Bill에 포함될 클래스들의 class_id 목록
 *               deadline:
 *                 type: string
 *                 format: date
 *                 description: Bill의 마감 기한
 *     responses:
 *       200:
 *         description: Bill 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "청구서 전송이 완료되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     bill_id:
 *                       type: integer
 *                       description: 생성된 Bill의 ID
 *                     amount:
 *                       type: number
 *                       description: 청구된 총 금액
 *                     deadline:
 *                       type: string
 *                       format: date
 *                       description: Bill의 마감 기한
 *       400:
 *         description: 입력된 class_id 또는 user_id가 유효하지 않음
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
router.post("/",authenticateJWT("CHIEF"), billController.createBill);

/**
 * @swagger
 * /bill/{academy_id}:
 *   get:
 *     summary: Bill 조회
 *     description: 특정 학원에 대한 Bill 목록을 지불 여부에 따라 필터링하여 조회합니다.
 *     tags: [Bill]
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
 *         name: isPaid
 *         schema:
 *           type: boolean
 *         description: 지불 여부에 따른 Bill 필터링 (기본값 false)
 *     responses:
 *       200:
 *         description: Bill 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "청구서 목록을 불러오는데 성공했습니다."
 *                 responseBillList:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       bill_id:
 *                         type: integer
 *                         description: Bill의 ID
 *                       deadline:
 *                         type: string
 *                         format: date
 *                         description: Bill의 마감 기한
 *                       amount:
 *                         type: number
 *                         description: 청구된 금액
 *                       paid:
 *                         type: boolean
 *                         description: 지불 여부
 *                       user_name:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 청구된 학생들의 이름
 *                       class_name:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 청구된 클래스들의 이름
 *       403:
 *         description: 학원에 대한 접근 권한이 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
//미&완납 청구서 목록 조회(원장)
router.get("/:academy_id", authenticateJWT("CHIEF"), billController.getBill);

/**
 * @swagger
 * /bill/my/{user_id}:
 *   get:
 *     summary: 내 Bill 조회
 *     description: 로그인한 사용자가 자신의 Bill 목록을 조회합니다.
 *     tags: [Bill]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 사용자의 ID
 *       - in: query
 *         name: isPaid
 *         schema:
 *           type: boolean
 *         description: 지불 여부에 따른 Bill 필터링 (기본값 false)
 *     responses:
 *       200:
 *         description: Bill 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "청구서 목록을 불러오는데 성공했습니다."
 *                 foundBillList:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: number
 *                         description: 청구된 금액
 *                       deadline:
 *                         type: string
 *                         format: date
 *                         description: Bill의 마감 기한
 *                       paid:
 *                         type: boolean
 *                         description: 지불 여부
 *       403:
 *         description: 사용자에 대한 접근 권한이 없습니다.
 *       404:
 *         description: 청구서가 존재하지 않습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
//미&완납 청구서 목록 조회(학생)
router.get("/my/:user_id", authenticateJWT("STUDENT", "PARENT"), billController.getMyBill);

module.exports = router;