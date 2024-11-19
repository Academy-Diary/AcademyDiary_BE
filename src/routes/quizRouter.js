const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const quizController = require("../controllers/quizController.js");

/**
 * @swagger
 * tags:
 *   name: Quiz
 *   description: 퀴즈 생성 및 관리
 */

/**
 * @swagger
 * /quiz/create:
 *   post:
 *     summary: 퀴즈 생성
 *     description: 주어진 키워드에 따라 퀴즈를 생성하고 MongoDB 및 MySQL에 저장합니다.
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 퀴즈 제목
 *                 example: "한국 역사 퀴즈"
 *               lecture_id:
 *                 type: integer
 *                 description: 연결된 강의의 ID
 *                 example: 1
 *               comment:
 *                 type: string
 *                 description: 퀴즈에 대한 추가 설명
 *                 example: "중급 난이도의 퀴즈입니다."
 *               keyword:
 *                 type: string
 *                 description: 퀴즈를 생성할 주제 키워드
 *                 example: "조선시대 역사"
 *     responses:
 *       201:
 *         description: 퀴즈가 성공적으로 생성됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "퀴즈가 성공적으로 생성되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "한국 역사 퀴즈"
 *                     comment:
 *                       type: string
 *                       example: "중급 난이도의 퀴즈입니다."
 *                     keyword:
 *                       type: string
 *                       example: "조선시대 역사"
 *                     exam_id:
 *                       type: integer
 *                       example: 1
 *                     user_id:
 *                       type: string
 *                       example: "12345"
 *                     quiz_list:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           question:
 *                             type: string
 *                             example: "조선의 초대 왕은 누구인가요?"
 *                           options:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["이성계", "세종대왕", "이순신", "김유신"]
 *                           answer:
 *                             type: object
 *                             example: {"0": "이성계"}
 *                           explanation:
 *                             type: string
 *                             example: "조선 건국의 중심 인물."
 *                     answer_list:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [0, 2]
 *       400:
 *         description: 잘못된 요청 (필수 필드 누락 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "모든 필드를 입력해주세요./ ${lecture_id_int}에 해당하는 강의가 존재하지 않습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "API 실행 중 오류가 발생했습니다."
 */

// 퀴즈 생성
router.post(
  "/create",
  authenticateJWT("CHIEF", "TEACHER"),
  quizController.createQuiz
);

/**
 * @swagger
 * tags:
 *   name: Quiz
 *   description: 퀴즈 문제 조회 및 풀이 API
 */

/**
 * @swagger
 * /quiz/{exam_id}/{quiz_num}:
 *   get:
 *     summary: 특정 퀴즈 문제 가져오기
 *     description: 주어진 exam_id와 quiz_num에 따라 특정 퀴즈 문제를 반환합니다.
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exam_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 퀴즈가 포함된 시험의 ID
 *         example: 47
 *       - in: path
 *         name: quiz_num
 *         required: true
 *         schema:
 *           type: integer
 *         description: 퀴즈 리스트에서 가져올 문제의 번호 (0부터 시작)
 *         example: 0
 *     responses:
 *       200:
 *         description: 요청한 퀴즈 문제 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 0:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                       example: "고구려, 백제, 신라 삼국 중 가장 먼저 건국된 나라는?"
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["고구려", "백제", "신라", "가야"]
 *                     answer:
 *                       type: object
 *                       example: {"0": "고구려"}
 *                     explanation:
 *                       type: string
 *                       example: "고구려는 기원전 37년에 건국된 것으로 알려져 있습니다."
 *       400:
 *         description: 잘못된 요청 (필수 매개변수 누락 또는 유효하지 않은 값)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "exam_id와 quiz_num은 필수입니다."
 *       404:
 *         description: 요청한 exam_id에 해당하는 퀴즈가 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "47에 해당하는 퀴즈가 존재하지 않습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "퀴즈 데이터를 불러오는 중 문제가 발생했습니다."
 */

// 퀴즈 문제 받아오기
router.get(
  "/:exam_id/:quiz_num",
  authenticateJWT("CHEIF", "TEACHER", "STUDENT"),
  quizController.getQuiz
);
module.exports = router;
