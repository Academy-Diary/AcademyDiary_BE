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
  generateNewTokens,
} = require("../lib/jwt/index.js");
const jwt = require("jsonwebtoken");
const path = require("path");
const {
  secretKey,
  gmailID,
  gmailPW,
  S3_BUCKET_NAME,
  DEFAULT_PROFILE_IMAGE,
} = require("../config/secret.js");
const { deleteFilesFromS3 } = require("../lib/middlewares/handlingFile");

exports.createUser = asyncWrapper(async (req, res, next) => {
  const {
    user_id,
    email,
    birth_date,
    user_name,
    phone_number,
    password,
    role,
  } = req.body;

  //bcrypt라이브러리로 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user
    .create({
      data: {
        user_id,
        email,
        birth_date: new Date(birth_date),
        user_name,
        password: hashedPassword,
        phone_number,
        role,
      },
    })
    .then((newUser) => {
      res
        .status(StatusCodes.CREATED)
        .json({ message: "회원가입이 완료되었습니다." });
    })
    .catch((err) => {
      console.log(err);
      // Prisma의 고유성 제약 조건 에러 처리 (이메일 또는 아이디 중복)
      if (err.code === "P2002") {
        const duplicatedField = err.meta.target; // 중복된 필드를 확인
        console.log(duplicatedField);
        let errorMessage = "중복된 값이 있습니다.";

        if (duplicatedField === "User_email_key") {
          errorMessage = "이미 사용 중인 이메일입니다.";
        } else if (duplicatedField === "User_user_id_key") {
          errorMessage = "이미 존재하는 아이디입니다.";
        } else if (duplicatedField === "User_phone_number_key") {
          errorMessage = "이미 존재하는 휴대폰 번호 입니다.";
        }

        return next(
          new CustomError(
            errorMessage,
            StatusCodes.CONFLICT,
            StatusCodes.CONFLICT
          )
        );
      }

      // 그 외의 에러 처리
      return next(
        new CustomError(
          "회원가입 중 오류가 발생했습니다.",
          StatusCodes.INTERNAL_SERVER_ERROR,
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    });
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
    const payload = {
      user_id: user_id,
      role: user.role,
      academy_id: user.academy_id,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true,
    }); //7일

    // 액세스 토큰을 Authorization 헤더에 추가
    res.setHeader("Authorization", `Bearer ${accessToken}`);

    const userStatus = await prisma.AcademyUserRegistrationList.findUnique({
      where: { user_id },
      select: { status: true },
    });

    const resUser = {
      user_id: user.user_id,
      academy_id: user.academy_id,
      email: user.email,
      birth_date: user.birth_date,
      user_name: user.user_name,
      phone_number: user.phone_number,
      role: user.role,
      image: user.image,
    };

    return res.status(StatusCodes.CREATED).json({
      message: "로그인 되었습니다.",
      userStatus,
      accessToken: accessToken,
      user: resUser,
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
exports.removeJWT = asyncWrapper(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  // 검사1: 토큰이 없을 경우
  if (!refreshToken) {
    return next(
      new CustomError(
        "리프레시 토큰이 쿠키에 존재하지 않습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  // 검사 2: 토큰이 정상적인 토큰이 아닌 경우
  try {
    jwt.verify(refreshToken, secretKey); // 토큰 유효성 검증
  } catch (err) {
    return next(
      new CustomError(
        "잘못된 리프레시 토큰입니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // 쿠키 삭제
  res.clearCookie("refreshToken");
  return res.status(StatusCodes.OK).json({ message: "로그아웃 되었습니다." });
});

// 리프레시 토큰을 사용하여 액세스 토큰 갱신
exports.refreshToken = asyncWrapper(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(
      new CustomError(
        "리프레시 토큰이 쿠키에 존재하지 않습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const { newAccessToken, newRefreshToken } = generateNewTokens(refreshToken);

  if (!newAccessToken) {
    return next(
      new CustomError(
        "유효하지 않거나 만료된 리프레시 토큰입니다. 다시 로그인 해주세요.",
        StatusCodes.FORBIDDEN,
        StatusCodes.FORBIDDEN
      )
    );
  }

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "None",
    secure: true,
  }); //7일

  return res.status(StatusCodes.CREATED).json({
    message: "액세스 토큰이 갱신되었습니다.",
    accessToken: newAccessToken,
  });
});

exports.checkIdDuplicated = asyncWrapper(async (req, res, next) => {
  const user_id = req.params["user_id"];

  // user_id가 공백인 경우
  if (user_id === null || !user_id.trim()) {
    return next(
      new CustomError(
        "아이디를 입력해 주세요.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const user = await prisma.user
    .findUnique({
      where: { user_id },
    })
    .catch((err) => {
      // Prisma 에러가 발생하면 CustomError로 처리하여 미들웨어 체인에 전달
      return next(
        new CustomError(
          "Prisma Error occurred!",
          ErrorCode.INTERNAL_SERVER_PRISMA_ERROR,
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    });

  if (user) {
    return next(
      new CustomError(
        "이미 존재하는 아이디입니다.",
        StatusCodes.CONFLICT,
        StatusCodes.CONFLICT
      )
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

  return res.status(StatusCodes.OK).json({ user_id: user.user_id });
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
    from: gmailID,
    to: email,
    subject: "academyPro 비밀번호 초기화 메일",
    html: `<p>비밀번호 초기화입니다. 로그인 후 비밀번호 변경 해주세요. </p><p>임시 비밀번호: ${newPassword}</p>`,
  };

  transporter.sendMail(emailOptions);

  return res
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

  return res
    .status(StatusCodes.OK)
    .json({ message: "회원 탈퇴가 완료되었습니다." });
});

// userController.js
// 회원 기본 정보 조회
exports.getUserBasicInfo = asyncWrapper(async (req, res, next) => {
  const user_id = req.params["user_id"];

  const user = await findUserByCriteria({ user_id });

  let family = null; // family 변수를 if 블록 밖에서 선언

  if (user.role === "STUDENT" || user.role === "PARENT") {
    family = await prisma.Family.findFirst({
      where: {
        ...(user.role === "STUDENT"
          ? { student_id: user_id }
          : { parent_id: user_id }),
      },
    });
  }

  const user_data = {
    user_id: user.user_id,
    academy_id: user.academy_id,
    email: user.email,
    birth_date: user.birth_date,
    user_name: user.user_name,
    phone_number: user.phone_number,
    role: user.role,
    image: user.image,
    family:
      family && user.role === "STUDENT"
        ? family.parent_id
        : family && user.role === "PARENT"
        ? family.student_id
        : null, // family가 없으면 null을 반환
  };

  return res.status(StatusCodes.OK).json({
    message: "회원 정보 조회가 완료되었습니다.",
    data: user_data,
  });
});

exports.getUserImageInfo = asyncWrapper(async (req, res, next) => {
  const user_id = req.params["user_id"];
  const user = await findUserByCriteria({ user_id });

  if (!user) {
    return next(
      new CustomError(
        "해당 사용자를 찾을 수 없습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }
  let image = user.image;
  if (!user.image) {
    image = DEFAULT_PROFILE_IMAGE;
  }

  return res.status(StatusCodes.OK).json({
    message: "회원 이미지 정보 조회가 완료되었습니다.",
    data: {
      user_id: user_id,
      image: image,
    },
  });
});

// 회원 기본 정보 수정
exports.updateUserBasicInfo = asyncWrapper(async (req, res, next) => {
  const user_id = req.params["user_id"];
  let { email, password, birth_date,  user_name, phone_number} = req.body;

  const user = await findUserByCriteria({ user_id });

  // 입력값이 없는 경우 기존 값으로 대체
  if (!email) {
    email = user.email;
  }
  if (!password) {
    password = user.password;
  } else {
    password = await bcrypt.hash(password, 10);
  }
  if (!birth_date) {
    birth_date = user.birth_date;
  }

  if (!user_name) {
    user_name = user.user_name;
  }
  if (!phone_number) {
    phone_number = user.phone_number;
  }


  await prisma.user.update({
    where: { user_id },
    data: {
      email,
      password,
      birth_date: new Date(birth_date),
      user_name,
      phone_number,
    },
  });

  return res.status(StatusCodes.OK).json({
    message: "회원 정보가 수정되었습니다.",
    data:{
      user_id: user_id,
      email: email,
      birth_date: birth_date,
      user_name: user_name,
      phone_number: phone_number,
    }
  });
});

// 회원 이미지 정보 수정
exports.updateUserImageInfo = asyncWrapper(async (req, res, next) => {
  const user_id = req.params["user_id"];

  // Multer에 의해 업로드된 파일이 없을 경우 에러 처리
  if (!req.file) {
    return next(
      new CustomError(
        "프로필 이미지 파일이 전송되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  // user_id가 존재하는지 확인
  const userExists = await prisma.user.findUnique({
    where: { user_id: user_id },
  });

  if (!userExists) {
    // 만약 잘못된 user_id를 받았다면, S3에 업로드된 이미지 삭제
    s3Prefix = `public/profile/${user_id}${path.extname(
      req.file.originalname
    )}`;
    await deleteFilesFromS3(S3_BUCKET_NAME, s3Prefix);
    return next(
      new CustomError(
        "해당 사용자를 찾을 수 없습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }
  // User DB에 이미지 정보가 없는 경우, 이미지 정보 추가
  if (!userExists.image) {
    console.log("이미지 정보 추가");
    await prisma.User.update({
      where: { user_id: user_id },
      data: {
        image: req.file.location,
      },
    });
  }

  return res.status(StatusCodes.OK).json({
    message: "회원 이미지 정보가 수정되었습니다.",
    user_id: user_id,
    image: req.file.location,
  });
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

exports.setFamily = asyncWrapper(async (req, res, next) => {
  const { parent_id, student_id } = req.body;

  if (!parent_id || !parent_id.trim() || !student_id || !student_id.trim()) {
    throw new CustomError(
      "유효한 parent_id, student_id을 입력해주세요.",
      StatusCodes.BAD_REQUEST,
      StatusCodes.BAD_REQUEST
    );
  }

  const student = await prisma.User.findUnique({
    where: { user_id: student_id, role: "STUDENT" },
  });
  if (!student) {
    throw new CustomError(
      `${student_id}는 User DB에 없는 학생입니다.`,
      StatusCodes.NOT_FOUND,
      StatusCodes.NOT_FOUND
    );
  }

  const family = await prisma.Family.create({
    data: {
      parent_id: parent_id,
      student_id: student_id,
    },
  });

  const isRegistered = await prisma.AcademyUserRegistrationList.findFirst({
    where: { user_id: student.user_id },
  });

  let status = null;
  // 만약 학생이 이미 등록된 상태라면, 부모의 상태를 학생의 상태로 설정
  if (isRegistered) {
    if (isRegistered.status === "APPROVED") {
      status = "APPROVED";
    } else if (isRegistered.status === "REJECTED") {
      status = "REJECTED";
    } else {
      status = "PENDING";
    }

    await prisma.AcademyUserRegistrationList.create({
      data: {
        user_id: parent_id,
        academy_id: isRegistered.academy_id,
        role: "PARENT",
        status: status,
      },
    });
  }
  const resData = {
    parent_id: family.parent_id,
    student_id: family.student_id,
    academy_id: student.academy_id,
    status: status,
  };

  return res.status(StatusCodes.CREATED).json({
    message: "학생-부모 관계가 설정되었습니다.",
    data: family,
  });
});
