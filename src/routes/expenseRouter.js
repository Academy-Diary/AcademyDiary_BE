const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const expenseController = require("../controllers/expenseController.js");


/**
 * @swagger
 * /expense/{academy_id}:
 *   post:
 *     summary: Class 생성
 *     description: CHIEF 권한을 가진 사용자가 특정 학원에 새로운 Class를 생성합니다.
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: academy_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class를 생성할 학원의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_name
 *               - expense
 *               - duration
 *             properties:
 *               class_name:
 *                 type: string
 *                 description: 생성할 Class의 이름
 *               expense:
 *                 type: number
 *                 description: Class의 비용
 *               discount:
 *                 type: number
 *                 description: 적용할 할인율 (선택 사항)
 *               duration:
 *                 type: integer
 *                 description: 수업의 기간(시간)
 *     responses:
 *       201:
 *         description: Class 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "성공적으로 Class를 생성했습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: integer
 *                       description: 생성된 Class의 ID
 *                     class_name:
 *                       type: string
 *                       description: 생성된 Class의 이름
 *                     academy_id:
 *                       type: string
 *                       description: 학원의 ID
 *                     expense:
 *                       type: number
 *                       description: Class의 비용
 *                     discount:
 *                       type: number
 *                       description: 할인율 (선택 사항)
 *                     duration:
 *                       type: integer
 *                       description: 수업의 기간
 *       400:
 *         description: 필수 필드가 누락되었습니다.
 *       403:
 *         description: 학원에 대한 생성 권한이 없습니다.
 *       409:
 *         description: 동일한 이름의 Class가 이미 존재합니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
//Class생성
router.post("/:academy_id", authenticateJWT("CHIEF"), expenseController.createClass);

/**
 * @swagger
 * /expense/{academy_id}:
 *   get:
 *     summary: Class 조회
 *     description: CHIEF 또는 TEACHER 권한을 가진 사용자가 특정 학원의 Class 목록을 조회합니다.
 *     tags: [Class]
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
 *         description: Class 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "성공적으로 Class를 조회했습니다."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       class_id:
 *                         type: integer
 *                         description: Class의 ID
 *                       class_name:
 *                         type: string
 *                         description: Class의 이름
 *                       academy_id:
 *                         type: string
 *                         description: 학원의 ID
 *                       expense:
 *                         type: number
 *                         description: Class의 비용
 *                       discount:
 *                         type: number
 *                         description: 할인율 (선택 사항)
 *                       duration:
 *                         type: integer
 *                         description: 수업의 기간
 *       400:
 *         description: 유효한 academy_id가 제공되지 않았습니다.
 *       403:
 *         description: 학원에 대한 조회 권한이 없습니다.
 *       404:
 *         description: 조회할 Class가 존재하지 않습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
//Class조회
router.get("/:academy_id", authenticateJWT("CHIEF","TEACHER"), expenseController.getClass);

/**
 * @swagger
 * /expense/{academy_id}/{class_id}:
 *   put:
 *     summary: Class 수정
 *     description: CHIEF 권한을 가진 사용자가 특정 학원의 Class 정보를 수정합니다.
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: academy_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 수정할 Class가 속한 학원의 ID
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 수정할 Class의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updateName:
 *                 type: string
 *                 description: 수정할 Class의 이름 (선택 사항)
 *               updateExpense:
 *                 type: number
 *                 description: 수정할 Class의 비용 (선택 사항)
 *               updateDiscount:
 *                 type: number
 *                 description: 수정할 할인율 (선택 사항)
 *               updateDuration:
 *                 type: integer
 *                 description: 수정할 수업의 기간 (선택 사항)
 *     responses:
 *       200:
 *         description: Class 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "성공적으로 Class를 수정했습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: integer
 *                       description: 수정된 Class의 ID
 *                     class_name:
 *                       type: string
 *                       description: 수정된 Class의 이름
 *                     expense:
 *                       type: number
 *                       description: 수정된 Class의 비용
 *                     discount:
 *                       type: number
 *                       description: 수정된 할인율
 *                     duration:
 *                       type: integer
 *                       description: 수정된 수업의 기간
 *       403:
 *         description: 학원에 대한 수정 권한이 없습니다.
 *       404:
 *         description: 수정할 Class를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
//Class수정
router.put("/:academy_id/:class_id", authenticateJWT("CHIEF"), expenseController.updateClass);

/**
 * @swagger
 * /expense/{academy_id}/{class_id}:
 *   delete:
 *     summary: Class 삭제
 *     description: CHIEF 권한을 가진 사용자가 특정 학원의 Class를 삭제합니다.
 *     tags: [Class]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: academy_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 Class가 속한 학원의 ID
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 Class의 ID
 *     responses:
 *       200:
 *         description: Class 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "성공적으로 Class를 삭제했습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     class_id:
 *                       type: integer
 *                       description: 삭제된 Class의 ID
 *                     class_name:
 *                       type: string
 *                       description: 삭제된 Class의 이름
 *       400:
 *         description: class_id가 제공되지 않았습니다.
 *       403:
 *         description: 학원에 대한 삭제 권한이 없습니다.
 *       404:
 *         description: 삭제할 Class를 찾을 수 없습니다.
 *       500:
 *         description: 클래스 삭제 중 서버 오류가 발생했습니다.
 */
//Class삭제
router.delete("/:academy_id/:class_id", authenticateJWT("CHIEF"), expenseController.deleteClass);


module.exports = router;