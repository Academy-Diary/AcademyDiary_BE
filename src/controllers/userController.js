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
const { secretKey, gmailID, gmailPW } = require("../config/secret");

exports.createUser = asyncWrapper(async (req, res, next) => {
  const {
    user_id,
    academy_id,
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
    return res.status(400).json({ message: "이미 존재하는 아이디입니다." });
  }

  //bcrypt라이브러리로 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user
    .create({
      data: {
        user_id,
        academy_id,
        email,
        birth_date,
        user_name,
        password: hashedPassword,
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

  res.status(201).json(newUser);
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
    return res.status(400).json({ message: "가입되지 않은 아이디입니다." });
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
    res.json({ accessToken });
  } else {
    res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
  }
});

//
exports.removeJWT = asyncWrapper(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  // 검사1: 토큰이 없을 경우
  if (!refreshToken) {
    res
      .status(400)
      .json({ message: "토큰이 없습니다. 로그인 상태를 확안하세요." });
    return;
  }
  // 검사 2: 토큰이 정상적인 토큰이 아닌 경우
  try {
    jwt.verify(refreshToken, secretKey); // 토큰 유효성 검증
  } catch (err) {
    return res.status(401).json({ message: "잘못된 리프레시 토큰입니다." });
  }

  // 쿠키 삭제
  res.clearCookie("refreshToken");
  res.json({ message: "로그아웃 되었습니다." });
});

// 리프레시 토큰을 사용하여 액세스 토큰 갱신
exports.refreshToken = asyncWrapper(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ message: "리프레시 토큰이 존재하지 않습니다." });
  }

  const newAccessToken = refreshAccessToken(refreshToken);

  if (!newAccessToken) {
    return res.status(403).json({
      message:
        "유효하지 않거나 만료된 리프레시 토큰입니다. 다시 로그인 해주세요.",
    });
  }

  res.json({ accessToken: newAccessToken });
});

exports.checkIdDuplicated = asyncWrapper(async (req, res, next) => {
  const user_id = req.params["user_id"].trim();

  // user_id가 공백인 경우
  if (!user_id) {
    throw new CustomError(
      "유효하지 않은 아이디입니다.",
      ErrorCode.BAD_REQUEST,
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
    return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
  } else {
    return res.status(200).json({ message: "사용 가능한 아이디입니다." });
  }
});

exports.findUserId = asyncWrapper(async (req, res, next) => {
  let { email, phone_number } = req.body;
  const regEmail =
    /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
  const regPhone = /^01([0|1|6|7|8|9])([0-9]{3,4})([0-9]{4})$/;
  // ref) https://choijying21.tistory.com/entry/자바스크립트-자주-쓰는-정규식-모음-이메일-핸드폰-주민번호-등 [JDevelog:티스토리]

  // email, phone_number 공백인 경우
  if (!email || !phone_number || !email.trim() || !phone_number.trim()) {
    throw new CustomError(
      "email, phone_number를 입력해주세요.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }
  // email, phone_number 형식이 맞지 않는 경우
  if (!regEmail.test(email) || !regPhone.test(phone_number)) {
    throw new CustomError(
      "email, phone_number 형식이 맞지 않습니다.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }

  const user = await prisma.user
    .findUniqueOrThrow({
      where: { email: email, phone_number: phone_number },
    })
    .catch((error) => {
      if (error.code === "P2018" || error.code === "P2025") {
        // prisma not found error code
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

  res.status(StatusCodes.OK).json({ user_id: user.user_id });
});

exports.resetUserPassword = asyncWrapper(async (req, res, next) => {
  let { user_id, email, phone_number } = req.body;
  const regEmail =
    /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
  const regPhone = /^01([0|1|6|7|8|9])([0-9]{3,4})([0-9]{4})$/;

  // user_id email, phone_number 공백인 경우
  if (
    !user_id ||
    !email ||
    !phone_number ||
    !user_id.trim() ||
    !email.trim() ||
    !phone_number.trim()
  ) {
    throw new CustomError(
      "user id, email, phone_number를 입력해주세요.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }
  // email, phone_number 형식이 맞지 않는 경우
  // if (!regEmail.test(email) || !regPhone.test(phone_number)) {
  //   throw new CustomError(
  //     "email, phone_number 형식이 맞지 않습니다.",
  //     StatusCodes.BAD_REQUEST,
  //     StatusCodes.BAD_REQUEST
  //   );
  // }
  // USER DB에 해당하는 유저가 있는지 확인
  const user = await prisma.user
    .findUniqueOrThrow({
      where: { user_id: user_id, email: email, phone_number: phone_number },
    })
    .catch((error) => {
      if (error.code === "P2018" || error.code === "P2025") {
        // prisma not found error code
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

  // 임시 비밀번호 전송
  const transporter = nodemailer.createTransport({
    service: "gmail", //gmail service 사용
    port: 465, //465 port를 통해 요청 전송
    secure: true, //보안모드 사용
    auth: {
      //gmail ID 및 password
      user: gmailID,
      pass: gmailPW,
    },
  });

  const newPassword = generateRandomPassword(8); // 8자리 임시 비밀번호 생성
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { id: user_id },
    data: { password: hashedPassword},
  });

  const emailOptions = {
    //비밀번호 초기화를 보내는 이메일의 Option
    from: gmailID, //관리자 Email
    to: email || "seonu2001@naver.com", //비밀번호 초기화 요청 유저 Email
    subject: "academyPro 비밀번호 초기화 메일", //보내는 메일의 제목
    //보내는 메일의 내용
    html:
      "<p>비밀번호 초기화입니다. 로그인 후 비밀번호 변경 해주세요</p>" +
      `<p>임시 비밀번호: ${newPassword}</p>`,
  };
  transporter.sendMail(emailOptions); //요청 전송

  res.send({ success: true });
  // 출처: https://well-made-codestory.tistory.com/37 [SJ BackEnd Log:티스토리]
});

function generateRandomPassword(temp_pw_lenngth = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";

  for (let i = 0; i < temp_pw_lenngth; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }

  return password;
}
