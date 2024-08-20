const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const bcrypt = require("bcrypt");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const {
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken,
} = require("../lib/jwt/index.js");
const jwt = require("jsonwebtoken");
const { secretKey } = require("../config/secret");

exports.createUser = asyncWrapper(async (req, res, next) => {
  const { user_id, academy_id, email, birth_date, user_name, password, role } =
    req.body;

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
        birth_date: new Date(req.body.birth_date),
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
    return res
      .status(403)
      .json({
        message:
          "유효하지 않거나 만료된 리프레시 토큰입니다. 다시 로그인 해주세요.",
      });
  }

  res.json({ accessToken: newAccessToken });
});
