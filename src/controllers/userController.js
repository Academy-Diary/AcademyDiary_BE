const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const {
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken,
} = require("../lib/jwt/index.js");
const jwt = require("jsonwebtoken");
const path = require("path");
const secretKey = process.env.JWT_SECRET_KEY;
const gmailID = process.env.GMAIL_ID;
const gmailPW = process.env.GMAIL_PW;

exports.createUser = asyncWrapper(async (req, res, next) => {
  const {
    user_id,
    academy_id, // 삭제해야함
    email,
    birth_date,
    user_name,
    phone_number,
    password,
    role,
  } = req.body;

  // 이미 존재하는 유저인지
  const user = await prisma.user.findUnique({
    where: { user_id },
  });
  if (user) {
    throw new CustomError(
      "이미 존재하는 아이디입니다.",
      StatusCodes.CONFLICT,
      StatusCodes.CONFLICT
    );
  }

  //bcrypt라이브러리로 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user
    .create({
      data: {
        user_id,
        academy_id,
        email,
        birth_date: new Date(birth_date),
        user_name,
        password: hashedPassword,
        phone_number,
        role,
      },
    })
    .catch((err) => {
      console.log(err);

      throw new CustomError(
        "Prisma Error accrued!",
        ErrorCode.INTERNAL_SERVER_PRISMA_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    });

  res
    .status(StatusCodes.CREATED)
    .json({ message: "회원가입이 완료되었습니다." });
});

exports.createJWT = asyncWrapper(async (req, res) => {
  const { user_id, password } = req.body;

  // 검사1: User DB에 존재 확인
  const user = await prisma.user.findUnique({
    where: { user_id },
  });
  // 해당 유저가 없는 경우
  if (!user) {
    console.log("가입되지 않은 아이디입니다.");
    throw new CustomError(
      "가입되지 않은 아이디입니다.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }
  // 검사2:비밀번호가 일치하는지 확인
  const isMatch = bcrypt.compareSync(password, user.password);
  if (isMatch) {
    const payload = { user_id: user_id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }); //7일

    // 액세스 토큰을 Authorization 헤더에 추가
    res.setHeader("Authorization", `Bearer ${accessToken}`);

    res.status(StatusCodes.CREATED).json({
      message: "로그인 되었습니다.",
      accessToken: accessToken,
    });
  } else {
    throw new CustomError(
      "비밀번호가 일치하지 않습니다.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }
});

//
exports.removeJWT = asyncWrapper(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  // 검사1: 토큰이 없을 경우
  if (!refreshToken) {
    throw new CustomError(
      "리프레시 토큰이 쿠키에 존재하지 않습니다.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }
  // 검사 2: 토큰이 정상적인 토큰이 아닌 경우
  try {
    jwt.verify(refreshToken, secretKey); // 토큰 유효성 검증
  } catch (err) {
    throw new CustomError(
      "잘못된 리프레시 토큰입니다.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }

  // 쿠키 삭제
  res.clearCookie("refreshToken");
  res.status(StatusCodes.OK).json({ message: "로그아웃 되었습니다." });
});

// 리프레시 토큰을 사용하여 액세스 토큰 갱신
exports.refreshToken = asyncWrapper(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new CustomError(
      "리프레시 토큰이 쿠키에 존재하지 않습니다.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }
  const newAccessToken = refreshAccessToken(refreshToken);

  if (!newAccessToken) {
    throw new CustomError(
      "유효하지 않거나 만료된 리프레시 토큰입니다. 다시 로그인 해주세요.",
      StatusCodes.FORBIDDEN,
      StatusCodes.FORBIDDEN
    );
  }

  res.status(StatusCodes.CREATED).json({
    message: "액세스 토큰이 갱신되었습니다.",
    accessToken: newAccessToken,
  });
});

exports.checkIdDuplicated = asyncWrapper(async (req, res, next) => {
  const user_id = req.params["user_id"];

  // user_id가 공백인 경우
  if (user_id === null || !user_id.trim()) {
    throw new CustomError(
      "아이디를 입력해 주세요.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }

  const user = await prisma.user
    .findUnique({
      where: { user_id },
    })
    .catch((err) => {
      // Prisma 에러가 발생하면 CustomError로 처리하여 미들웨어 체인에 전달
      throw new CustomError(
        "Prisma Error occurred!",
        ErrorCode.INTERNAL_SERVER_PRISMA_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    });

  if (user) {
    throw new CustomError(
      "이미 존재하는 아이디입니다.",
      StatusCodes.CONFLICT,
      StatusCodes.CONFLICT
    );
  } else {
    return res
      .status(StatusCodes.OK)
      .json({ message: "사용 가능한 아이디입니다." });
  }
});

// 아이디 찾기
exports.findUserId = asyncWrapper(async (req, res, next) => {
  const { email, phone_number } = req.body;

  validateRequestData(email, phone_number);

  const user = await findUserByCriteria({ email, phone_number });

  res.status(StatusCodes.OK).json({ user_id: user.user_id });
});

// 비밀번호 재설정
exports.resetUserPassword = asyncWrapper(async (req, res, next) => {
  const { user_id, email, phone_number } = req.body;

  validateRequestData(email, phone_number, user_id);

  const user = await findUserByCriteria({ user_id, email, phone_number });

  // 임시 비밀번호 생성 및 해싱
  const newPassword = generateRandomPassword(8);
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { user_id },
    data: { password: hashedPassword },
  });

  // 이메일 전송 설정
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: {
      user: gmailID,
      pass: gmailPW,
    },
  });

  const emailOptions = {
    from: process.env.GMAIL_ID,
    to: email,
    subject: "academyPro 비밀번호 초기화 메일",
    html: `<p>비밀번호 초기화입니다. 로그인 후 비밀번호 변경 해주세요. </p><p>임시 비밀번호: ${newPassword}</p>`,
  };

  transporter.sendMail(emailOptions);

  res
    .status(StatusCodes.OK)
    .json({ message: "비밀번호가 초기화 메일이 발송되었습니다." });
});

// 회원 탈퇴 함수
exports.deleteUser = asyncWrapper(async (req, res, next) => {
  const user_id = req.params["user_id"];

  const user = await findUserByCriteria({ user_id });

  console.log(user);
  if (user.academy_id !== null && user.academy_id.trim() !== "") {
    return next(
      new CustomError(
        "학원에 소속된 유저는 탈퇴할 수 없습니다.",
        StatusCodes.FORBIDDEN,
        StatusCodes.FORBIDDEN
      )
    );
  }
  await prisma.user.delete({
    where: { user_id },
  });

  res.status(StatusCodes.OK).json({ message: "회원 탈퇴가 완료되었습니다." });
});

// 회원 기본 정보 조회
exports.getUserBasicInfo = asyncWrapper(async (req, res, next) => {
  const user_id = req.params["user_id"];

  const user = await findUserByCriteria({ user_id });

  res.sendFile(path.resolve(__dirname, `../../public/profile/${user.image}`));

  res.status(StatusCodes.OK).json({
    user_id: user.user_id,
    academy_id: user.academy_id,
    email: user.email,
    birth_date: user.birth_date,
    user_name: user.user_name,
    phone_number: user.phone_number,
    role: user.role,
    image: user.image,
  });
});

exports.getUserImageInfo = asyncWrapper(async (req, res, next) => {
  const user_id = req.params["user_id"];

  const user = await findUserByCriteria({ user_id });

  // 이미지 파일 경로 설정
  const imagePath = path.resolve(__dirname, `../../public/profile/${user.image}`);

  // 이미지 파일 반환
  res.sendFile(imagePath);
});

// 유효성 검사 함수
function validateRequestData(email, phone_number, user_id = undefined) {
  // ref) https://choijying21.tistory.com/entry/자바스크립트-자주-쓰는-정규식-모음-이메일-핸드폰-주민번호-등 [JDevelog:티스토리]

  const regEmail =
    /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
  const regPhone = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;

  if (!email || !phone_number || !email.trim() || !phone_number.trim()) {
    throw new CustomError(
      "email, phone_number를 입력해주세요.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }

  if (!regEmail.test(email) || !regPhone.test(phone_number)) {
    throw new CustomError(
      "email, phone_number 형식이 맞지 않습니다.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }

  if (user_id !== undefined && (user_id === null || !user_id.trim())) {
    throw new CustomError(
      "user id를 입력해주세요.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }
}

// 유저 검색 함수
async function findUserByCriteria(criteria) {
  return await prisma.user
    .findUniqueOrThrow({
      where: criteria,
    })
    .catch((error) => {
      if (error.code === "P2018" || error.code === "P2025") {
        throw new CustomError(
          "해당하는 유저가 존재하지 않습니다.",
          StatusCodes.NOT_FOUND,
          StatusCodes.NOT_FOUND
        );
      } else {
        throw new CustomError(
          "Prisma Error occurred!",
          ErrorCode.INTERNAL_SERVER_PRISMA_ERROR,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }
    });
}
// 임시 비밀번호 생성 함수
function generateRandomPassword(temp_pw_lenngth = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: temp_pw_lenngth }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}
