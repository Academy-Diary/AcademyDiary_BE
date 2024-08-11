const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const bcrypt = require("bcrypt");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { generateToken } = require("../lib/jwt/index.js");
 
exports.createUser = asyncWrapper(async (req, res, next) => {
  const { user_id, password } = req.body;

  // 유효성 검사 id, password등 입력 형식에 맞는지.

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
        password: hashedPassword,
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
    const token = generateToken(payload);
    res.cookie("token", token, { httpOnly: true, maxAge: 3600000 });
    res.json({ message: "로그인 되었습니다." });
  } else {
    res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
  }
});

// 
exports.removeJWT = asyncWrapper(async (req, res) => {
  const token = req.cookies.token;
  // 검사1: 토큰이 없을 경우
  if (!token) {
    res
      .status(400)
      .json({ message: "토큰이 없습니다. 로그인 상태를 확안하세요." });
    return;
  }
  // 검사 2: 토큰이 정상적인 토큰이 아닌 경우
  const decoded = jwt.decode(token);
  if (!decoded) {
    res
      .status(401)
      .json({ message: "잘못된 토큰입니다. 로그인 상태를 확인하세요." });
    return;
  }

  // 쿠키 삭제
  res.clearCookie("token");
  res.json({ message: "로그아웃 되었습니다." });
});
