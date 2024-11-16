const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const lectureController = require("../controllers/lectureController.js");

/**
 * @swagger
 * /lecture:
 *   get:
 *     summary: 강사별 강의(또는 학원 내 모든 강의) 조회
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: false
 *         schema:
 *           type: string
 *         description: 강사 ID, 없을 시 전체 강의
 *     responses:
 *       200:
 *         description: 성공적으로 강의를 불러옴
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
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
 *                       teacher_id:
 *                         type: string
 *                         description: 강사 ID
 *                       teacher_name:
 *                         type: string
 *                         description: 강사 이름
 *                       headcount:
 *                         type: integer
 *                         description: 현재 강의 수강 인원
 *                       academy_id:
 *                         type: string
 *                         description: 학원 ID
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                         description: 강의 시작 시간
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                         description: 강의 종료 시간
 *                       days:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 강의 요일 목록
 *             example:
 *               message: "강의를 성공적으로 불러왔습니다."
 *               data:
 *                 - lecture_id: 1
 *                   lecture_name: "한국사"
 *                   teacher_id: "test_teacher"
 *                   headcount: 0
 *                   academy_id: "test_academy"
 *                   start_time: "2024-10-16T04:30:00.000Z"
 *                   end_time: "2024-10-16T06:00:00.000Z"
 *                   teacher_name: "홍길동"
 *                   days: ["TUESDAY", "THURSDAY"]
 *       404:
 *         description: 개설된 강의가 존재하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "현재 개설된 강의가 존재하지 않습니다."
 */

//학원내의 모든 강의 조회
router.get(
  "/",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.getLecture
);
/**
 * @swagger
 * /lecture:
 *   post:
 *     summary: 강의 생성
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lecture_name:
 *                 type: string
 *               user_id:
 *                 type: string
 *               academy_id:
 *                 type: string
 *               day:
 *                 type: array
 *                 items:
 *                   type: string
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *     responses:
 *       200:
 *         description: 강의가 성공적으로 생성됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 lecture:
 *                   type: object
 *                   properties:
 *                     lecture_id:
 *                       type: integer
 *                     lecture_name:
 *                       type: string
 *                     teacher_id:
 *                       type: string
 *                     days:
 *                       type: array
 *                       items:
 *                         type: string
 *                     start_time:
 *                       type: string
 *                       example: "14:00"
 *                     end_time:
 *                       type: string
 *                       example: "16:00"
 *             example:
 *               message: "새로운 강의가 생성되었습니다!"
 *               lecture:
 *                 lecture_id: 1
 *                 lecture_name: "Math"
 *                 teacher_id: "user123"
 *                 days: ["Monday", "Wednesday"]
 *                 start_time: "14:00"
 *                 end_time: "16:00"
 *       400:
 *         description: 유효하지 않은 입력
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "유효하지 않은 입력입니다!"
 */
//강의 생성
router.post("/", authenticateJWT("CHIEF"), lectureController.createLecture);
/**
 * @swagger
 * /lecture/{lecture_id}:
 *   put:
 *     summary: 강의 수정
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 강의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lecture_name:
 *                 type: string
 *               teacher_id:
 *                 type: string
 *               day:
 *                 type: array
 *                 items:
 *                   type: string
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *     responses:
 *       200:
 *         description: 강의가 성공적으로 수정됨
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
 *                     lecture_id:
 *                       type: integer
 *                     lecture_name:
 *                       type: string
 *                     teacher_id:
 *                       type: string
 *                     day:
 *                       type: array
 *                       items:
 *                         type: string
 *                     start_time:
 *                       type: string
 *                     end_time:
 *                       type: string
 *             example:
 *               message: "수정이 성공적으로 완료되었습니다."
 *               data:
 *                 lecture_id: 1
 *                 lecture_name: "Math"
 *                 teacher_id: "user123"
 *                 day: ["Monday", "Wednesday"]
 *                 start_time: "14:00"
 *                 end_time: "16:00"
 *       400:
 *         description: 유효하지 않은 입력
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "유효하지 않은 입력입니다."
 */
//강의 수정
router.put(
  "/:lecture_id",
  authenticateJWT("CHIEF"),
  lectureController.modifyLecture
);
/**
 * @swagger
 * /lecture/{lecture_id}:
 *   delete:
 *     summary: 강의 삭제
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 강의 ID
 *     responses:
 *       200:
 *         description: 강의가 성공적으로 삭제됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 lecture_id:
 *                   type: integer
 *             example:
 *               message: "삭제가 성공적으로 완료되었습니다."
 *               lecture_id: 1
 *       400:
 *         description: 유효하지 않은 입력
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "유효한 lecture_id가 제공되지 않았습니다."
 */
//강의 삭제
router.delete(
  "/:lecture_id",
  authenticateJWT("CHIEF"),
  lectureController.deleteLecture
);
/**
 * @swagger
 * /lecture/{lecture_id}/student:
 *   get:
 *     summary: 강의 수강생 조회
 *     description: 특정 강의에 등록된 수강생 목록을 조회합니다.
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 강의의 ID
 *     responses:
 *       200:
 *         description: 수강생 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "수강생을 성공적으로 불러왔습니다."
 *                 lecture_id:
 *                   type: integer
 *                   description: 강의 ID
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                         description: 수강생의 사용자 ID
 *                       user_name:
 *                         type: string
 *                         description: 수강생의 이름
 *                       email:
 *                         type: string
 *                         description: 수강생의 이메일
 *                       phone_number:
 *                         type: string
 *                         description: 수강생의 전화번호
 *       400:
 *         description: 유효하지 않은 lecture_id가 제공되었습니다.
 *       404:
 *         description: 수강생이 없거나 불러올 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
// 강의 수강생 조회
router.get(
  "/:lecture_id/student",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.getLectureStudent
);
/**
 * @swagger
 * /lecture/{lecture_id}/student:
 *   post:
 *     summary: 강의에 수강생 추가
 *     description: 특정 강의에 새로운 수강생을 추가하고, 수강생 수를 업데이트합니다.
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수강생을 추가할 강의의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 추가할 수강생의 ID
 *             example:
 *               user_id: "test_student"
 *     responses:
 *       200:
 *         description: 수강생 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "수강생을 성공적으로 추가했습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     lecture_id:
 *                       type: integer
 *                       description: 강의 ID
 *                     user_id:
 *                       type: string
 *                       description: 수강생 ID
 *       400:
 *         description: 유효하지 않은 lecture_id 또는 user_id가 제공되었습니다.
 *       500:
 *         description: 수강생 추가 중 서버 오류가 발생했습니다.
 */

//강의 수강생 추가
router.post(
  "/:lecture_id/student",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.createLectureStudent
);

/**
 * @swagger
 * /lecture/{lecture_id}/student:
 *   delete:
 *     summary: 강의에서 수강생 제거
 *     description: 특정 강의에서 수강생을 제거하고, 수강생 수를 업데이트합니다.
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수강생을 제거할 강의의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 제거할 수강생의 ID
 *             example:
 *               user_id: "test_student"
 *     responses:
 *       200:
 *         description: 수강생 제거 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "수강생을 성공적으로 삭제했습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     lecture_id:
 *                       type: integer
 *                       description: 강의 ID
 *                     user_id:
 *                       type: string
 *                       description: 삭제된 수강생 ID
 *       400:
 *         description: 유효하지 않은 lecture_id 또는 user_id가 제공되었습니다.
 *       500:
 *         description: 수강생 삭제 중 서버 오류가 발생했습니다.
 */

//강의 수강생 제거
router.delete(
  "/:lecture_id/student",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.deleteLectureStudent
);

/**
 * @swagger
 * /lecture/{lecture_id}/student:
 *   put:
 *     summary: 강의 수강생 목록 업데이트
 *     description: 특정 강의의 수강생 목록을 업데이트합니다. 기존 수강생 목록에서 새 수강생을 추가하거나 기존 수강생을 제거할 수 있습니다.
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수강생 목록을 업데이트할 강의의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentList
 *             properties:
 *               studentList:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 업데이트할 수강생 ID 목록
 *             example:
 *               studentList: ["test_student", "test_student2"]
 *     responses:
 *       200:
 *         description: 수강생 목록 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "수강생 목록이 성공적으로 업데이트되었습니다."
 *                 addedStudents:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 새로 추가된 수강생 ID 목록
 *                 removedStudents:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 제거된 수강생 ID 목록
 *       400:
 *         description: 유효하지 않은 lecture_id 또는 수강생 목록이 제공되었습니다.
 *       404:
 *         description: 강의를 찾을 수 없습니다.
 *       500:
 *         description: 수강생 목록 업데이트 중 서버 오류가 발생했습니다.
 */
//강의 수강생목록 업데이트
router.put(
  "/:lecture_id/student",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.putLectureStudent
);

/**
 * @swagger
 * /lecture/{lecture_id}/exam:
 *   post:
 *     summary: 강의에 대한 새로운 시험을 생성
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 강의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               exam_name:
 *                 type: string
 *               exam_type_id:
 *                 type: string
 *               exam_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *     responses:
 *       201:
 *         description: 시험이 성공적으로 생성됨
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
 *                     exam_id:
 *                       type: integer
 *                     lecture_id:
 *                       type: integer
 *                     exam_name:
 *                       type: string
 *                     exam_type_id:
 *                       type: integer
 *                     exam_date:
 *                       type: string
 *                       format: date
 *             example:
 *               message: "시험이 성공적으로 생성되었습니다."
 *               data:
 *                 exam_id: 9,
 *                 lecture_id: 129
 *                 exam_name: "단원평가2"
 *                 high_score: 0
 *                 low_score: 100
 *                 average_score: "0"
 *                 total_score: 0
 *                 created_at: "2024-10-03T17:00:40.048Z"
 *                 exam_date: "2024-12-01T00:00:00.000Z"
 *                 exam_type_id: 1
 *                 headcount: 0
 *       400:
 *         description: 유효하지 않은 입력
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "유효한 lecture_id, exam_name, exam_type_id, exam_date가 제공되지 않았습니다."
 */
// 시험 생성
router.post(
  "/:lecture_id/exam",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.createExam
);
/**
 * @swagger
 * /lecture/{lecture_id}/exam:
 *   get:
 *     summary: 강의에 대한 시험 목록 조회
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 강의 ID
 *     responses:
 *       200:
 *         description: 성공적으로 시험을 불러옴
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
 *                     lecture_id:
 *                       type: integer
 *                     exams:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           exam_id:
 *                             type: integer
 *                           exam_name:
 *                             type: string
 *                           exam_date:
 *                             type: string
 *                             format: date
 *                     exam_cnt:
 *                       type: integer
 *             example:
 *               message: "시험을 성공적으로 불러왔습니다."
 *               data:
 *                 lecture_id: 1001
 *                 exams:
 *                   - exam_id: 9,
 *                     lecture_id: 129
 *                     exam_name: "단원평가2"
 *                     high_score: 0
 *                     low_score: 100
 *                     average_score: "0"
 *                     total_score: 0
 *                     created_at: "2024-10-03T17:00:40.048Z"
 *                     exam_date: "2024-12-01T00:00:00.000Z"
 *                     exam_type_id: 1
 *                     headcount: 0
 *                 exam_cnt: 1
 *       404:
 *         description: 시험이 존재하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "현재 개설된 시험이 존재하지 않습니다."
 */
// 시험 조회
router.get(
  "/:lecture_id/exam",
  authenticateJWT("CHIEF", "TEACHER", "STUDENT", "PARENT"),
  lectureController.getExam
);

/**
 * @swagger
 * /lecture/{lecture_id}/exam/{exam_id}:
 *   delete:
 *     summary: 강의에서 시험 삭제
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 강의 ID
 *       - in: path
 *         name: exam_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 시험 ID
 *     responses:
 *       200:
 *         description: 시험이 성공적으로 삭제됨
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
 *                     lecture_id:
 *                       type: integer
 *                     exam_id:
 *                       type: integer
 *             example:
 *               message: "시험 삭제가 완료되었습니다."
 *               data:
 *                 lecture_id: 1001
 *                 exams:
 *                  exam_id: 9,
 *                  lecture_id: 129
 *                  exam_name: "단원평가2"
 *                  high_score: 0
 *                  low_score: 100
 *                  average_score: "0"
 *                  total_score: 0
 *                  created_at: "2024-10-03T17:00:40.048Z"
 *                  exam_date: "2024-12-01T00:00:00.000Z"
 *                  exam_type_id: 1
 *                  headcount: 0
 *       400:
 *         description: 유효하지 않은 시험 ID 또는 강의 ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "유효한 lecture_id, exam_id가 제공되지 않았습니다."
 */
// 시험 삭제
router.delete(
  "/:lecture_id/exam/:exam_id(\\d+)",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.deleteExam
);
/**
 * @swagger
 * /lecture/{lecture_id}/exam/{exam_id}/score:
 *   post:
 *     summary: 시험에 대한 성적 입력
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 강의 ID
 *       - in: path
 *         name: exam_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 시험 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scoreList:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     score:
 *                       type: number
 *     responses:
 *       201:
 *         description: 성적이 성공적으로 입력됨
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
 *                     exam_id:
 *                       type: integer
 *                     scoreList:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                           score:
 *                             type: number
 *             example:
 *               message: "성적이 성공적으로 입력되었습니다."
 *               data:
 *                 exam_id: 1
 *                 scoreList:
 *                   - user_id: "user123"
 *                     score: 95
 *       400:
 *         description: 유효하지 않은 입력
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "유효한 lecture_id, exam_id, user_id, score가 제공되지 않았습니다."
 */
// 시험 성적 입력
router.post(
  "/:lecture_id/exam/:exam_id(\\d+)/score",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.createScore
);
/**
 * @swagger
 * /lecture/{lecture_id}/exam/{exam_id}/score:
 *   get:
 *     summary: 시험 성적 조회
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 강의 ID
 *       - in: path
 *         name: exam_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 시험 ID
 *     responses:
 *       200:
 *         description: 성공적으로 성적을 불러옴
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
 *                     exam_id:
 *                       type: integer
 *                     scoreList:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                           score:
 *                             type: number
 *                     student_cnt:
 *                       type: integer
 *             example:
 *               message: "성적을 성공적으로 불러왔습니다."
 *               data:
 *                 exam_id: 1
 *                 scoreList:
 *                   - user_id: "user123"
 *                     score: 95
 *                 student_cnt: 20
 *       404:
 *         description: 성적이 존재하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "성적이 존재하지 않습니다."
 */
// 시험 성적 조회
router.get(
  "/:lecture_id/exam/:exam_id(\\d+)/score",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.getExamScore
);

/**
 * @swagger
 * /lecture/{lecture_id}/exam/{exam_id}/score:
 *   put:
 *     summary: 시험 성적 수정
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 강의 ID
 *       - in: path
 *         name: exam_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 시험 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *               score:
 *                 type: number
 *     responses:
 *       200:
 *         description: 성적이 성공적으로 수정됨
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
 *                     updatedScore:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                         score:
 *                           type: number
 *                     exam:
 *                       type: object
 *                       properties:
 *                         low_score:
 *                           type: number
 *                         high_score:
 *                           type: number
 *                         average_score:
 *                           type: number
 *                         total_score:
 *                           type: number
 *             example:
 *               message: "성적이 성공적으로 수정되었습니다."
 *               data:
 *                 updatedScore:
 *                   user_id: "user123"
 *                   score: 95
 *                 exam:
 *                   low_score: 60
 *                   high_score: 100
 *                   average_score: 85
 *                   total_score: 1700
 *       400:
 *         description: 유효하지 않은 입력
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "유효한 lecture_id, exam_id, user_id가 제공되지 않았습니다."
 */
// 시험 성적 수정
router.put(
  "/:lecture_id/exam/:exam_id(\\d+)/score",
  authenticateJWT("CHIEF", "TEACHER"),
  lectureController.modifyScore
);
/**
 * @swagger
 * /lecture/{lecture_id}/score:
 *   get:
 *     summary: 시험 유형별 성적 조회
 *     tags: [Lecture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 강의 ID
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *       - in: query
 *         name: exam_type_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 시험 유형 ID
 *       - in: query
 *         name: asc
 *         schema:
 *           type: boolean
 *         description: 성적 정렬 기준 (오름차순 여부)
 *     responses:
 *       200:
 *         description: 성적 변동을 성공적으로 조회함
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
 *                     lecture_id:
 *                       type: integer
 *                     exam_data:
 *                       type: object
 *                       properties:
 *                         exam_type:
 *                           type: object
 *                           properties:
 *                             exam_type_id:
 *                               type: integer
 *                             exam_type_name:
 *                               type: string
 *                         exam_list:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               exam_id:
 *                                 type: integer
 *                               exam_name:
 *                                 type: string
 *                               exam_date:
 *                                 type: string
 *                                 format: date
 *                               score:
 *                                 type: number
 *             example:
 *               message: "성공적으로 성적을 불러왔습니다."
 *               data:
 *                 user_id: "user123"
 *                 lecture_id: 1001
 *                 exam_data:
 *                   exam_type:
 *                     exam_type_id: 1
 *                     exam_type_name: "Midterm"
 *                   exam_list:
 *                     - exam_id: 1
 *                       exam_name: "Midterm Exam"
 *                       exam_date: "2024-01-01"
 *                       score: 95
 *       400:
 *         description: 유효하지 않은 입력
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "유효한 lecture_id, user_id, exam_type_id가 제공되지 않았습니다."
 */
// My과목 성적변동 데이터 받기(시험 종류별)
router.get(
  "/:lecture_id(\\d+)/score",
  authenticateJWT("CHIEF", "TEACHER", "STUDENT", "PARENT"),
  lectureController.getExamTypeScore
);

module.exports = router;
