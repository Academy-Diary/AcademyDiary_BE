const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { updateHeadcount } = require("../lib/prisma/headcount");

exports.deleteStudent = asyncWrapper(async (req, res, next) => {
  const arr_user_id = req.body.user_id;

  if (!arr_user_id) {
    return next(
      new CustomError(
        "유효한 user_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // 학부모 ID 배열 가져오기
  const parents = await prisma.Family.findMany({
    where: {
      student_id: { in: arr_user_id },
    },
    select: {
      parent_id: true,
    },
  });

  const parentIds = parents.map((p) => p.parent_id).filter((id) => id !== null);
  const deletedUserIds = [...arr_user_id, ...parentIds];

  try {
    // 모든 작업을 하나의 트랜잭션으로 실행
    const result = await prisma.$transaction(async (prisma) => {
      // 1. 학생 및 학부모 관련 데이터 삭제
      await prisma.user.updateMany({
        where: {
          user_id: { in: arr_user_id },
        },
        data: {
          academy_id: null,
        },
      });

      await prisma.AcademyUserRegistrationList.deleteMany({
        where: {
          user_id: { in: arr_user_id },
        },
      });

      if (parentIds.length > 0) {
        await prisma.user.updateMany({
          where: {
            user_id: { in: parentIds },
          },
          data: {
            academy_id: null,
          },
        });

        await prisma.AcademyUserRegistrationList.deleteMany({
          where: {
            user_id: { in: parentIds },
          },
        });
      }

      // 2. 학원의 Headcount 업데이트
      return await updateHeadcount(prisma, req.user.academy_id);
    });

    return res.status(StatusCodes.OK).json({
      message: "학생/학부모 삭제가 성공적으로 완료되었습니다.",
      data: {
        deletedUserIds,
        student_headcount: result.student_headcount,
        teacher_headcount: result.teacher_headcount,
      },
    });
  } catch (error) {
    console.error("트랜잭션 실패:", error);
    return next(
      new CustomError(
        "학생 삭제 중 오류가 발생했습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  }
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
      parent:
        family && family.parent // family가 존재하고 parent가 있는지 확인
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
          start_time: true,
          end_time: true,
          days: {
            select: {
              day: true,
            },
          },
          teacher: {
            select: {
              user_name: true, // 강사의 이름만 선택
            },
          },
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
