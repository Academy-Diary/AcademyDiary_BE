const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const userController = require("../controllers/userController.js");
const { uploadProfileImage } = require("../lib/middlewares/handlingFile");

/**
 * @swagger
 * /user/signup:
 *   post:
 *     summary: "회원가입"
 *     description: "유저 회원가입을 처리합니다."
 *     tags: [User]  # Users라는 태그로 묶어서 관리
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: "유저 아이디 (중복 불가)"
 *               email:
 *                 type: string
 *                 description: "유저 이메일 (중복 불가)"
 *               birth_date:
 *                 type: string
 *                 format: date
 *                 description: "생년월일 (YYYY-MM-DD 형식)"
 *               user_name:
 *                 type: string
 *                 description: "유저 이름"
 *               phone_number:
 *                 type: string
 *                 description: "전화번호 (중복 불가)"
 *               password:
 *                 type: string
 *                 description: "비밀번호"
 *               role:
 *                 type: string
 *                 description: "유저 역할 (ADMIN, USER 등)"
 *     responses:
 *       201:
 *         description: "성공적으로 회원가입 완료"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "회원가입이 완료되었습니다."
 *       409:
 *         description: "중복된 유저 정보"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "이미 사용 중인 이메일입니다. || 이미 존재하는 아이디입니다. || 이미 존재하는 휴대폰 번호 입니다."
 *       500:
 *         description: "서버 내부 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "회원가입 중 오류가 발생했습니다."
 */
// 회원가입
router.post(`/signup`, userController.createUser);

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: "로그인"
 *     description: "유저가 로그인하여 JWT 토큰을 발급받습니다."
 *     tags: [User]  # Users라는 태그로 묶어서 관리
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: "유저 아이디"
 *                 example: "test_chief"
 *               password:
 *                 type: string
 *                 description: "유저 비밀번호"
 *                 example: "test_pw"
 *     responses:
 *       201:
 *         description: "로그인 성공, JWT 토큰 발급"
 *         headers:
 *           Authorization:
 *             description: "액세스 토큰"
 *             schema:
 *               type: string
 *               example: "Bearer {JWT 토큰}"
 *         set-cookie:
 *           description: "리프레시 토큰 (refreshToken), 쿠키에 저장"
 *           schema:
 *             type: string
 *             example: "refreshToken={JWT 토큰}; Path=/; HttpOnly"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인 되었습니다."
 *                 userStatus:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       description: "유저의 상태"
 *                 accessToken:
 *                   type: string
 *                   description: "발급된 액세스 토큰"
 *                 user:
 *                   type: object
 *                   description: "로그인된 유저 정보"
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       example: "testuser"
 *                     academy_id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     birth_date:
 *                       type: string
 *                       format: date
 *                     user_name:
 *                       type: string
 *                     phone_number:
 *                       type: string
 *                     role:
 *                       type: string
 *                     uploadProfileImage:
 *                       type: string
 *       400:
 *         description: "로그인 실패, 잘못된 아이디 또는 비밀번호"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "가입되지 않은 아이디입니다. || 비밀번호가 일치하지 않습니다."
 */
// 로그인
router.post("/login", userController.createJWT);

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: "로그아웃"
 *     description: "리프레시 토큰을 삭제하여 로그아웃 처리합니다."
 *     tags: [User]
 *     responses:
 *       200:
 *         description: "성공적으로 로그아웃 처리됨"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그아웃 되었습니다."
 *       400:
 *         description: "쿠키에 리프레시 토큰이 없거나 잘못된 리프레시 토큰"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "리프레시 토큰이 쿠키에 존재하지 않습니다. || 잘못된 리프레시 토큰입니다."
 */
// 로그아웃
router.post(
  "/logout",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.removeJWT
);

/**
 * @swagger
 * /user/refresh-token:
 *   post:
 *     summary: "액세스 토큰 갱신"
 *     description: "리프레시 토큰을 이용해 새로운 액세스 토큰을 발급합니다."
 *     tags: [User]
 *     responses:
 *       201:
 *         description: "액세스 토큰이 성공적으로 갱신됨"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "액세스 토큰이 갱신되었습니다."
 *                 accessToken:
 *                   type: string
 *                   description: "새로 발급된 액세스 토큰"
 *       400:
 *         description: "리프레시 토큰이 없거나 유효하지 않음"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "리프레시 토큰이 쿠키에 존재하지 않습니다."
 *       403:
 *         description: "리프레시 토큰이 만료되었거나 유효하지 않음"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "유효하지 않거나 만료된 리프레시 토큰입니다. 다시 로그인 해주세요."
 */
// 리프레시 토큰을 사용하여 액세스 토큰 갱신
router.post("/refresh-token", userController.refreshToken);

/**
 * @swagger
 * /user/check-id/{user_id}:
 *   get:
 *     summary: "아이디 중복 확인"
 *     description: "유저 아이디가 중복되었는지 확인합니다."
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: "중복 확인할 유저 아이디"
 *         example: "testuser123"
 *     responses:
 *       200:
 *         description: "사용 가능한 아이디"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "사용 가능한 아이디입니다."
 *       400:
 *         description: "아이디가 공백이거나 입력되지 않았을 때"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "아이디를 입력해 주세요."
 *       409:
 *         description: "이미 존재하는 아이디"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "이미 존재하는 아이디입니다."
 *       500:
 *         description: "서버 내부 오류 또는 Prisma 관련 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Prisma Error occurred!"
 */
// 아이디 중복 확인
router.get("/check-id/:user_id", userController.checkIdDuplicated);

/**
 * @swagger
 * /user/find-id:
 *   post:
 *     summary: 사용자의 아이디 찾기
 *     description: 이메일과 휴대폰 번호를 통해 사용자의 아이디를 조회합니다.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phone_number
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 사용자의 이메일
 *               phone_number:
 *                 type: string
 *                 description: 사용자의 휴대폰 번호
 *     responses:
 *       200:
 *         description: 아이디 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                   description: 사용자의 아이디
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       404:
 *         description: 해당 조건에 맞는 사용자를 찾을 수 없습니다.
 */
// 아이디 찾기
router.post("/find-id", userController.findUserId);

/**
 * @swagger
 * /user/reset-password:
 *   post:
 *     summary: 비밀번호 재설정
 *     description: 사용자의 아이디, 이메일, 휴대폰 번호를 통해 비밀번호를 초기화하고 임시 비밀번호를 이메일로 발송합니다.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - email
 *               - phone_number
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 사용자의 아이디
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 사용자의 이메일
 *               phone_number:
 *                 type: string
 *                 description: 사용자의 휴대폰 번호
 *     responses:
 *       200:
 *         description: 비밀번호 초기화 성공 및 메일 발송 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 비밀번호 초기화 메일이 발송되었음을 알리는 메시지
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       404:
 *         description: 해당 조건에 맞는 사용자를 찾을 수 없습니다.
 */
// 비밀번호 찾기
router.post("/reset-password", userController.resetUserPassword);

/**
 * @swagger
 * /user/{user_id}:
 *   delete:
 *     summary: 회원 탈퇴
 *     description: 특정 사용자를 회원 탈퇴 처리합니다. 학원에 소속된 유저는 탈퇴할 수 없습니다.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 탈퇴할 사용자의 ID
 *     responses:
 *       200:
 *         description: 회원 탈퇴 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "회원 탈퇴가 완료되었습니다."
 *       403:
 *         description: 학원에 소속된 유저는 탈퇴할 수 없습니다.
 *       404:
 *         description: 해당 사용자를 찾을 수 없습니다.
 */
// 회원 탈퇴
router.delete(
  "/:user_id",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.deleteUser
);

/**
 * @swagger
 * /user/{user_id}/image-info:
 *   get:
 *     summary: 사용자의 프로필 이미지 조회
 *     description: 특정 사용자의 프로필 이미지 URL을 반환합니다. 이미지가 없을 경우 기본 프로필 이미지를 반환합니다.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 프로필 이미지를 조회할 사용자의 ID
 *     responses:
 *       200:
 *         description: 프로필 이미지 반환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                   example: 회원 이미지 정보 조회가 완료되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       description: 조회된 사용자의 ID
 *                       example: "test_parent"
 *                     image:
 *                       type: string
 *                       description: 사용자의 프로필 이미지 URL
 *                       example: "https://adac-storage.s3.us-west-2.amazonaws.com/public/profile/default.png"
 *       404:
 *         description: 해당 사용자를 찾을 수 없습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 해당 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버에서 이미지를 반환하는 중 오류가 발생했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 서버에서 이미지를 반환하는 중 오류가 발생했습니다.
 */

// 사용자 이미지 정보 API
router.get(
  "/:user_id/image-info",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.getUserImageInfo
);

/**
 * @swagger
 * /user/{user_id}/basic-info:
 *   get:
 *     summary: 회원 기본 정보 조회
 *     description: 특정 사용자의 기본 정보를 조회합니다. 학생(STUDENT)이나 학부모(PARENT)의 경우 관련된 가족 정보를 포함하여 반환합니다.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 기본 정보를 조회할 사용자의 ID
 *     responses:
 *       200:
 *         description: 회원 기본 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "회원 정보 조회가 완료되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       description: 사용자의 아이디
 *                     academy_id:
 *                       type: string
 *                       description: 사용자가 소속된 학원의 아이디
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: 사용자의 이메일
 *                     birth_date:
 *                       type: string
 *                       format: date
 *                       description: 사용자의 생년월일
 *                     user_name:
 *                       type: string
 *                       description: 사용자의 이름
 *                     phone_number:
 *                       type: string
 *                       description: 사용자의 휴대폰 번호
 *                     role:
 *                       type: string
 *                       description: 사용자의 역할 (STUDENT, PARENT 등)
 *                     uploadProfileImage:
 *                       type: string
 *                       description: 사용자의 프로필 이미지 파일명
 *                     family:
 *                       type: string
 *                       nullable: true
 *                       description: 사용자가 학생일 경우 부모 아이디, 학부모일 경우 학생 아이디
 *       404:
 *         description: 해당 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
// 사용자 정보 API
router.get(
  "/:user_id/basic-info",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.getUserBasicInfo
);

/**
 * @swagger
 * /user/{user_id}/basic-info:
 *   put:
 *     summary: 회원 기본 정보 수정
 *     description: 특정 사용자의 기본 정보를 수정합니다. 입력된 값이 없는 경우 기존 값을 유지합니다.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 기본 정보를 수정할 사용자의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@naver.com"
 *                 description: 수정할 사용자의 이메일 (입력하지 않으면 기존 값 유지)
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "new_password"
 *                 description: 수정할 비밀번호 (입력하지 않으면 기존 값 유지)
 *               birth_date:
 *                 type: string
 *                 format: date
 *                 example: "YYYY-MM-DD"
 *                 description: 수정할 사용자의 생년월일 (입력하지 않으면 기존 값 유지)
 *               user_name:
 *                 type: string
 *                 example: "new_name"
 *                 description: 수정할 사용자의 이름 (입력하지 않으면 기존 값 유지)
 *               phone_number:
 *                 type: string
 *                 example: "010-1234-5678"
 *                 description: 수정할 사용자의 전화번호 (입력하지 않으면 기존 값 유지)
 *     responses:
 *       200:
 *         description: 회원 기본 정보 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "회원 정보가 성공적으로 수정되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       description: 수정된 사용자의 ID
 *                     email:
 *                       type: string
 *                       description: 수정된 이메일
 *                     birth_date:
 *                       type: string
 *                       description: 수정된 생년월일
 *                     user_name:
 *                       type: string
 *                       description: 수정된 사용자 이름
 *                     phone_number:
 *                       type: string
 *                       description: 수정된 전화번호
 *       400:
 *         description: 입력 데이터가 잘못되었습니다.
 *       404:
 *         description: 해당 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
// 회원 기본 정보 수정 API
router.put(
  "/:user_id/basic-info",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.updateUserBasicInfo
);

/**
 * @swagger
 * /user/{user_id}/image-info:
 *   put:
 *     summary: 회원 이미지 정보 수정
 *     description: 특정 사용자의 프로필 이미지를 수정합니다. 이미지 파일은 Multipart/form-data 형식으로 업로드해야 합니다.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 프로필 이미지를 수정할 사용자의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 프로필 이미지 파일
 *     responses:
 *       200:
 *         description: 회원 이미지 정보 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "회원 이미지 정보가 수정되었습니다."
 *                   description: "회원 이미지 정보가 수정되었습니다."
 *                 user_id:
 *                   type: string
 *                   example: "test_student"
 *                   description: 이미지가 수정된 사용자의 ID
 *                 image:
 *                   type: string
 *                   example: "https://adac-storage.s3.us-west-2.amazonaws.com/public/profile/test_student.jpg"
 *                   description: 수정된 이미지 파일 경로
 *       400:
 *         description: 이미지 파일이 전송되지 않았습니다.
 *       404:
 *         description: 해당 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
// 사용자 이미지 정보 수정 API
router.put(
  "/:user_id/image-info",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  uploadProfileImage.single("file"),
  userController.updateUserImageInfo
);

/**
 * @swagger
 * /user/family:
 *   post:
 *     summary: 학생과 부모 관계 설정
 *     description: 학생과 부모 간의 관계를 설정하고, 부모의 학원 등록 상태를 학생의 상태로 설정합니다.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parent_id
 *               - student_id
 *             properties:
 *               parent_id:
 *                 type: string
 *                 description: 부모의 사용자 ID
 *               student_id:
 *                 type: string
 *                 description: 학생의 사용자 ID
 *     responses:
 *       201:
 *         description: 학생-부모 관계 설정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: "학생-부모 관계가 설정되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     parent_id:
 *                       type: string
 *                       description: 부모의 사용자 ID
 *                     student_id:
 *                       type: string
 *                       description: 학생의 사용자 ID
 *                     academy_id:
 *                       type: string
 *                       description: 학원 ID (등록된 경우)
 *                     status:
 *                       type: string
 *                       description: 학원 등록 상태 (APPROVED, REJECTED, PENDING)
 *       400:
 *         description: 유효한 parent_id 또는 student_id가 입력되지 않았습니다.
 *       404:
 *         description: 주어진 student_id에 해당하는 학생을 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
// 학생 학부모 관계설정 API
router.post("/family", userController.setFamily);

/**
 * @swagger
 * /user/academy-info:
 *   get:
 *     summary: 학원 정보 조회
 *     description: 사용자가 속한 학원의 정보를 조회합니다.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 학원 정보를 성공적으로 불러왔습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 학원 정보를 성공적으로 불러왔습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     academy_id:
 *                       type: string
 *                       description: 학원의 고유 ID
 *                       example: "1234-5678-9012"
 *                     academy_name:
 *                       type: string
 *                       description: 학원의 이름
 *                       example: "한빛 학원"
 *                     academy_email:
 *                       type: string
 *                       description: 학원의 이메일
 *                       example: "info@hanbitacademy.com"
 *                     address:
 *                       type: string
 *                       description: 학원의 주소
 *                       example: "서울시 강남구 테헤란로 123"
 *                     phone_number:
 *                       type: string
 *                       description: 학원의 전화번호
 *                       example: "02-1234-5678"

 *       404:
 *         description: 학원 정보를 찾을 수 없습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "학원 정보를 찾을 수 없습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버에서 오류가 발생했습니다."
 */

router.get(
  "/academy-info",
  authenticateJWT("CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.getAcademyInfo
);
/**
 * @swagger
 * /user/check-password:
 *   post:
 *     summary: 비밀번호 확인
 *     description: 현재 로그인한 사용자의 비밀번호가 입력한 값과 일치하는지 확인합니다.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: 확인할 비밀번호
 *                 example: "your_password"
 *     responses:
 *       200:
 *         description: 비밀번호 확인 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 결과 메시지
 *                   example: "비밀번호가 일치합니다."
 *                 isMatched:
 *                   type: boolean
 *                   description: 비밀번호가 일치하는지 여부
 *                   example: true
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버에서 오류가 발생했습니다."
 */

// 비밀번호 확인 API
router.post(
  "/check-password",
  authenticateJWT("ADMIN", "CHIEF", "TEACHER", "STUDENT", "PARENT"),
  userController.checkPassword
/**
 * @swagger
 * /user/academy-info:
 *   post:
 *     summary: 학원 정보 수정
 *     description: CHIEF 권한을 가진 사용자가 학원의 정보를 수정합니다. 제공되지 않은 필드는 기존 값을 유지합니다.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               academy_name:
 *                 type: string
 *                 description: 학원의 이름 (Optional)
 *                 example: "새로운 한빛 학원"
 *               academy_email:
 *                 type: string
 *                 description: 학원의 이메일 (Optional)
 *                 example: "new_info@hanbitacademy.com"
 *               address:
 *                 type: string
 *                 description: 학원의 주소 (Optional)
 *                 example: "서울시 강남구 테헤란로 456"
 *               phone_number:
 *                 type: string
 *                 description: 학원의 전화번호 (Optional)
 *                 example: "02-9876-5432"
 *     responses:
 *       200:
 *         description: 학원 정보 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                   example: "학원 정보가 성공적으로 수정되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     academy_id:
 *                       type: string
 *                       description: 학원의 고유 ID
 *                       example: "1234-5678-9012"
 *                     academy_name:
 *                       type: string
 *                       description: 수정된 학원의 이름
 *                       example: "새로운 한빛 학원"
 *                     academy_email:
 *                       type: string
 *                       description: 수정된 학원의 이메일
 *                       example: "new_info@hanbitacademy.com"
 *                     address:
 *                       type: string
 *                       description: 수정된 학원의 주소
 *                       example: "서울시 강남구 테헤란로 456"
 *                     phone_number:
 *                       type: string
 *                       description: 수정된 학원의 전화번호
 *                       example: "02-9876-5432"
 *       401:
 *         description: 인증 실패 또는 권한 부족
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: 학원 정보를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "학원 정보를 찾을 수 없습니다."
 *       500:
 *         description: 서버 오류 발생
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버에서 오류가 발생했습니다."
 */
router.post(
  "/academy-info",
  authenticateJWT("CHIEF"),
  userController.updateAcademyInfo
);
module.exports = router;
