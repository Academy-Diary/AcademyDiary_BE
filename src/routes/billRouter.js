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
router.post("/", billController.createBill);


module.exports = router;