// noticeRouter.js
const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const noticeController = require("../controllers/noticeController");
const { uploadNoticeFile } = require("../lib/middlewares/uploadFile.js");
const { fetchRecentNoticeNum } = require("../lib/middlewares/fetchNoticeInfo.js");
/**
 * @swagger
 * /notice/create:
 *   post:
 *     summary: 공지 업로드
 *     description: 새로운 공지사항을 업로드합니다. 'CHIEF' 또는 'TEACHER' 권한이 필요합니다.
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 공지 제목
 *                 example: 코로나19로 인한 학원 운영 방침
 *               content:
 *                 type: string
 *                 description: 공지 내용
 *                 example: 코로나19로 인한 운영 방침 안내
 *               academy_id:
 *                 type: string
 *                 description: 학원 ID
 *                 example: test_academy2
 *               lecture_id:
 *                 type: integer
 *                 description: 강의 ID (전체 공지의 경우 "0")
 *                 example: 0
 *               file:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 공지에 첨부할 파일
 *     responses:
 *       201:
 *         description: 공지가 성공적으로 생성되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 공지사항이 성공적으로 생성되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     notice:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                           example: 코로나19로 인한 학원 운영 방침
 *                         content:
 *                           type: string
 *                           example: 코로나19로 인한 운영 방침 안내
 *                         academy_id:
 *                           type: string
 *                           example: test_academy2
 *                         lecture_id:
 *                           type: integer
 *                           example: 0
 *                         user_id:
 *                           type: string
 *                           example: chief_seonu
 *                         notice_num:
 *                           type: integer
 *                           example: 5
 *                         notice_id:
 *                           type: string
 *                           example: test_academy2_0_5
 *                     files:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["코로나.jpg"]
 *       400:
 *         description: 유효한 값들이 입력되지 않았습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 유효한 값들을 입력해주세요.
 *       500:
 *         description: 파일 이동 중 오류가 발생했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 파일 이동 중 오류가 발생했습니다.
 */

router.post(
  "/create",
  authenticateJWT("CHIEF", "TEACHER"),
  uploadNoticeFile.array("file"),
  noticeController.createNotice
);
/**
 * @swagger
 * /notice/list:
 *   get:
 *     summary: 공지 목록 조회
 *     description: 학원 및 강의에 대한 공지 목록을 조회합니다. 'CHIEF', 'TEACHER', 'PARENT', 또는 'STUDENT' 권한이 필요합니다.
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lecture_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 조회할 강의 ID
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *         description: 페이지 번호
 *         example: 1
 *       - in: query
 *         name: page_size
 *         required: true
 *         schema:
 *           type: integer
 *         description: 한 페이지에 표시할 공지 개수
 *         example: 10
 *     responses:
 *       200:
 *         description: 공지 목록 조회에 성공했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 공지사항 목록 조회에 성공했습니다.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: 코로나19로 인한 학원 운영 방침
 *                       content:
 *                         type: string
 *                         example: 코로나19 예방 방침 공지합니다.
 *                       user_id:
 *                         type: string
 *                         example: chief_seonu
 *                       views:
 *                         type: integer
 *                         example: 123
 *                       notice_id:
 *                         type: string
 *                         example: test_academy2_0_5
 *       400:
 *         description: 유효하지 않은 파라미터가 입력되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 유효한 값들을 입력해주세요.
 */
// 공지 목록 조회
router.get(
  "/list",
  authenticateJWT("CHIEF", "TEACHER", "PARENT", "STUDENT"),
  noticeController.getNoticeList
);
/**
 * @swagger
 * /notice/{notice_id}:
 *   delete:
 *     summary: 공지 삭제
 *     description: 지정된 ID의 공지사항을 삭제합니다. 'CHIEF' 또는 'TEACHER' 권한이 필요합니다.
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notice_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 공지의 ID, 형식은 academy_id&lecture_id&notice_num입니다.
 *         example: test_academy2&0&5
 *     responses:
 *       200:
 *         description: 공지가 성공적으로 삭제되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 공지사항이 성공적으로 삭제되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     notice:
 *                       type: object
 *                       description: 삭제된 공지의 정보
 *                     files:
 *                       type: array
 *                       description: 삭제된 공지의 파일 목록
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: test_academy2_0_5_file1
 *                           file:
 *                             type: string
 *                             example: /public/notice/test_academy2/0/5/sample.jpg
 *       400:
 *         description: 유효한 값들이 입력되지 않았습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 유효한 값들을 입력해주세요.
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 디렉토리 삭제 중 오류가 발생했습니다.
 */

// 공지 삭제
router.delete(
  "/:notice_id",
  authenticateJWT("CHIEF", "TEACHER"),
  noticeController.deleteNotice
);
/**
 * @swagger
 * /notice/{notice_id}:
 *   put:
 *     summary: 공지 수정
 *     description: 기존 공지의 제목, 내용 및 첨부 파일을 수정합니다. 'CHIEF' 또는 'TEACHER' 권한이 필요합니다.
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notice_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 수정할 공지의 ID로, 형식은 academy_id&lecture_id&notice_num입니다.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 공지 제목
 *                 example: 코로나19로 인한 학원 운영 방침 
 *               content:
 *                 type: string
 *                 description: 공지 내용
 *                 example: 코로나19로 인한 운영 방침 안내
 *               files_deleted:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: 
 *                 description: 삭제할 파일 목록
 *               file:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 새로 추가할 파일 목록
 *     responses:
 *       200:
 *         description: 공지사항이 성공적으로 수정되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 공지사항이 성공적으로 수정되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     notice:
 *                       type: object
 *                       description: 수정된 공지의 정보
 *                     files:
 *                       type: array
 *                       description: 현재 공지에 첨부된 파일 목록
 *                       items:
 *                         type: string
 *       400:
 *         description: 유효하지 않은 값이 입력되었습니다.
 *       500:
 *         description: 서버에서 파일을 수정하는 중 오류가 발생했습니다.
 */

// 공지 수정
router.put(
  "/:notice_id",
  authenticateJWT("CHIEF", "TEACHER"),
  uploadNoticeFile.array("file"),
  noticeController.updateNotice
);


module.exports = router;
