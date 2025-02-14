const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const billController = require("../controllers/billController.js");


/**
 * @swagger
 * /bill:
 *   post:
 *     summary: Bill 생성
 *     description: 여러 학생과 클래스 정보를 바탕으로 청구서를 생성합니다. 할인 정보를 반영하여 총 금액을 계산합니다.
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
 *                 description: 청구서를 생성할 학생들의 ID
 *               class_id:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 청구서에 포함할 클래스 ID 목록
 *               deadline:
 *                 type: string
 *                 format: date
 *                 description: 청구서의 마감 기한
 *             example:
 *               user_id: ["test_student", "test_student2"]
 *               class_id: [1, 2]
 *               deadline: "2024-12-31"
 *     responses:
 *       200:
 *         description: 청구서 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "청구서 전송이 완료되었습니다."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       bill_id:
 *                         type: integer
 *                         description: 생성된 Bill의 ID
 *                       amount:
 *                         type: number
 *                         description: 총 청구 금액 (할인 반영)
 *                       deadline:
 *                         type: string
 *                         format: date
 *                         description: 청구서의 마감 기한
 *       400:
 *         description: 입력된 클래스 또는 유저 ID가 유효하지 않음
 *       500:
 *         description: 청구서 생성 중 서버 오류가 발생했습니다.
 */
router.post("/",authenticateJWT("CHIEF"), billController.createBill);

/**
 * @swagger
 * /bill/{academy_id}:
 *   get:
 *     summary: 청구서 목록 조회
 *     description: 특정 학원에서 청구서 목록을 지불 여부에 따라 조회합니다.
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
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: 청구서 목록 조회 성공
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
 *                         description: 청구서 ID
 *                       deadline:
 *                         type: string
 *                         format: date
 *                         description: 청구서의 마감 기한
 *                       amount:
 *                         type: number
 *                         description: 청구된 금액
 *                       paid:
 *                         type: boolean
 *                         description: 지불 여부
 *                       user_name:
 *                         type: string
 *                         description: 청구된 사용자 이름
 *                       class_name:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 청구서에 포함된 클래스 이름 목록
 *       403:
 *         description: 학원에 대한 접근 권한이 없습니다.
 *       404:
 *         description: 청구서가 존재하지 않습니다.
 *       500:
 *         description: 청구서 조회 중 서버 오류가 발생했습니다.
 */
//미&완납 청구서 목록 조회(원장)
router.get("/:academy_id", authenticateJWT("CHIEF"), billController.getBill);

/**
 * @swagger
 * /bill/my/{user_id}:
 *   get:
 *     summary: 내 Bill 조회
 *     description: 로그인한 사용자가 자신의 청구서 목록을 조회합니다. 청구서에 포함된 클래스 이름도 함께 반환됩니다.
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
 *     responses:
 *       200:
 *         description: 청구서 목록 조회 성공
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
 *                         description: 청구서 ID
 *                       amount:
 *                         type: number
 *                         description: 청구된 금액
 *                       deadline:
 *                         type: string
 *                         format: date
 *                         description: 청구서의 마감 기한
 *                       paid:
 *                         type: boolean
 *                         description: 지불 여부
 *                       class_name:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 청구서에 포함된 클래스 이름
 *       403:
 *         description: 사용자에 대한 접근 권한이 없습니다.
 *       404:
 *         description: 청구서가 존재하지 않습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
router.get("/my/:user_id", authenticateJWT("STUDENT", "PARENT"), billController.getMyBill);

/**
 * @swagger
 * /bill/{academy_id}/pay:
 *   patch:
 *     summary: 청구서 결제 상태 업데이트
 *     description: 특정 학원에서 선택한 청구서 목록의 결제 상태를 업데이트합니다.
 *     tags: [Bill]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: academy_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 결제 상태를 업데이트할 학원의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetBillList
 *               - paid
 *             properties:
 *               targetBillList:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 결제 상태를 업데이트할 청구서 ID 목록
 *               paid:
 *                 type: boolean
 *                 description: 청구서의 결제 상태
 *     responses:
 *       200:
 *         description: 청구서 결제 상태 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "청구서가 성공적으로 업데이트 되었습니다."
 *                 updatedBills:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   description: 업데이트된 청구서 ID 목록
 *       400:
 *         description: paid 값이 유효하지 않거나 다른 요청 오류 발생
 *       403:
 *         description: 학원에 대한 접근 권한이 없습니다.
 *       404:
 *         description: 유효한 청구서가 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
router.patch("/:academy_id/pay", authenticateJWT("CHIEF"), billController.payBill);

module.exports = router;