const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");

exports.deleteStudent = asyncWrapper(async (req, res, next) => {
  const { user_id } = req.params;

  //user_id가 올바르게 전달되었는지 확인
  if (!user_id || user_id.trim() === "") {
    return next(
      new CustomError(
        "유효한 user_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  //학생 정보 조회
  const userTableStudent = await prisma.user.findUnique({
    where: {
      user_id: user_id,
    },
  });

  const registerationTableStudent =
    await prisma.AcademyUserRegistrationList.findUnique({
      where: {
        user_id: user_id,
      },
    });

  // 학생이 존재하지 않거나 학생 역할이 아닌 경우
  if (!userTableStudent || userTableStudent.role !== "STUDENT") {
    return next(
      new CustomError(
        `User DB에 ID ${user_id}에 해당하는 학생이 없습니다.`,
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }

  if (
    !registerationTableStudent ||
    registerationTableStudent.role !== "STUDENT"
  ) {
    return next(
      new CustomError(
        `AcademyUserRegistrationList DB에 ID ${user_id}에 해당하는 학생이 없습니다.`,
        StatusCodes.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  }

  //학생의 academy_id를 NULL로 업데이트
  await prisma.user.update({
    where: {
      user_id: user_id,
    },
    data: {
      academy_id: null,
    },
  });

  //AcademyUserRegistrationList에서 해당 학생 행 삭제
  await prisma.AcademyUserRegistrationList.delete({
    where: {
      user_id: user_id,
    },
  });

  const family = await prisma.family.findFirst({
    where: {
      student_id: user_id,
    },
  });
  const parent_id = family ? family.parent_id : null;

  if (parent_id) {
    //부모의 academy_id를 NULL로 업데이트
    await prisma.user.update({
      where: {
        user_id: parent_id,
      },
      data: {
        academy_id: null,
      },
    });
    //AcademyUserRegistrationList에서 해당 부모 행 삭제
    await prisma.AcademyUserRegistrationList.delete({
      where: {
        user_id: parent_id,
      },
    });
  }

  // 성공 응답
  return res.status(StatusCodes.OK).json({
    message: `학생 ID ${user_id}, 학부모 ID ${parent_id} 의 academy_id가 성공적으로 NULL로 설정되었고, 등록 목록에서 삭제되었습니다.`,
  });
});

exports.getStudent = asyncWrapper(async (req, res, next) => {
  const { academy_id } = req.params;

  // JWT에서 academy_id를 추출 (인증 미들웨어를 통해 토큰을 디코드하고 req.user에 저장되어있음)
  const userAcademyId = req.user.academy_id; // JWT 토큰에서 가져온 academy_id

  // 사용자가 다른 학원의 수업을 수정하려고 하는지 체크
  if (userAcademyId !== academy_id) {
    return next(
      new CustomError(
        "해당 학원에 대한 접근 권한이 없습니다.",
        StatusCodes.FORBIDDEN,
        StatusCodes.FORBIDDEN
      )
    );
  }
  // 나중에 User DB에서 가져오게끔 수정.
  const students = await prisma.User.findMany({
    where: {
      academy_id: academy_id,
      role: "STUDENT",
    },
    select: {
      user_id: true,
      user_name: true,
      phone_number: true,
      familiesAsStudent: {
        select: {
          parent: {
            select: {
              user_name: true,
              phone_number: true,
            },
          },
        },
      },
    },
  });
  console.log(students);
  if (!students || students.length === 0) {
    return next(
      new CustomError(
        "등록되어 있는 학생이 없습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }

  const resData = students.map((student) => {
    const family = student.familiesAsStudent[0]; // 첫 번째 요소를 가져옴
    return {
      user_id: student.user_id,
      user_name: student.user_name,
      phone_number: student.phone_number,
      parent: family && family.parent // family가 존재하고 parent가 있는지 확인
        ? {
            user_name: family.parent.user_name,
            phone_number: family.parent.phone_number,
          }
        : null,
    };
  });



  // 성공 응답
  return res.status(StatusCodes.OK).json({
    message: "학생를 성공적으로 불러왔습니다.",
    data: resData,
  });
});

exports.getStudentLecture = asyncWrapper(async (req, res, next) => {
  const { user_id } = req.params;

  // 유효성 검사: user_id가 제공되지 않았을 경우
  if (!user_id || !user_id.trim()) {
    return next(
      new CustomError(
        "유효한 user_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const rawLectures = await prisma.LectureParticipant.findMany({
    where: { user_id: user_id },
    include: {
      lecture: {
        select: {
          lecture_id: true,
          lecture_name: true,
          days: {
            select: {
              day: true,
            },
          },
          start_time: true,
          end_time: true,
        },
      },
    },
  });
  // 각 강의에서 day 필드를 추출하여 가공
  const lectures = rawLectures.map((x) => ({
    ...x.lecture,
    days: x.lecture.days.map((dayObj) => dayObj.day), // 각 강의의 day 값만 추출
  }));

  return res.status(StatusCodes.OK).json({
    message: "학생이 수강 중인 강의를 성공적으로 불러왔습니다.",
    lectures: lectures,
  });
});
