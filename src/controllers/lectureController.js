const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { Prisma } = require("@prisma/client"); // Prisma 객체를 가져옵니다.

// lectureController.js
exports.getLecture = asyncWrapper(async (req, res, next) => {
  const user_id = req.query.user_id;
  const academy_id = req.user.academy_id;

  // where 조건을 동적으로 설정
  const whereCondition = {
    academy_id: academy_id,
    ...(user_id ? { teacher_id: user_id } : null),
  };

  const LectureList = await prisma.Lecture.findMany({
    where: whereCondition,
    include: {
      days: {
        select: {
          day: true,
        },
      },
      teacher: {
        select: {
          user_id: true,
          user_name: true,
        },
      },
    },
  });

  if (!LectureList || LectureList.length === 0) {
    return next(
      new CustomError(
        "현재 개설된 강의가 존재하지 않습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }
  // 각 강의에 대해 필요한 필드만 포함한 새로운 객체 배열 생성
  const formattedLectureList = LectureList.map((lecture) => ({
    lecture_id: lecture.lecture_id,
    lecture_name: lecture.lecture_name,
    teacher_id: lecture.teacher_id,
    teacher_name: lecture.teacher.user_name, // teacher_name 필드로 추가
    headcount: lecture.headcount,
    academy_id: lecture.academy_id,
    start_time: lecture.start_time,
    end_time: lecture.end_time,
    days: lecture.days.map((dayObj) => dayObj.day), // days에서 day 값만 추출
  }));

  return res.status(StatusCodes.OK).json({
    message: "강의를 성공적으로 불러왔습니다.",
    data: formattedLectureList,
  });
});
//강의 생성
exports.createLecture = asyncWrapper(async (req, res, next) => {
  const { lecture_name, user_id, academy_id, day, start_time, end_time } =
    req.body;

  if (
    !lecture_name ||
    lecture_name.length === 0 ||
    !user_id ||
    !academy_id ||
    !day ||
    !start_time ||
    !end_time
  ) {
    return next(
      new CustomError(
        "유효하지 않은 입력입니다!",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // time은 "14:00"형식으로 입력받음(String)
  const [start_hours, start_minutes] = start_time.split(":");
  const [end_hours, end_minutes] = end_time.split(":");
  const lectureStartTime = new Date();
  const lectureEndTime = new Date();
  lectureStartTime.setHours(start_hours, start_minutes, 0, 0);
  lectureEndTime.setHours(end_hours, end_minutes, 0, 0);

  const result = await prisma.Lecture.create({
    data: {
      lecture_name,
      teacher_id: user_id,
      academy_id,
      days: {
        create: day.map((day) => ({
          day: day, // days 배열의 각 요소를 LectureDay에 저장
        })),
      },
      start_time: lectureStartTime,
      end_time: lectureEndTime,
    },
    include: {
      // days 관계도 포함하여 응답
      days: {
        select: {
          day: true,
        },
      },
    },
  });

  const formattedDays = result.days.map((dayObj) => dayObj.day);

  return res.status(StatusCodes.OK).json({
    message: "새로운 강의가 생성되었습니다!",
    lecture: {
      ...result,
      days: formattedDays,
    },
  });
});

//강의 수정
exports.modifyLecture = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;
  let { lecture_name, teacher_id, day, start_time, end_time } = req.body;

  const target_id = parseInt(lecture_id, 10);

  const targetLecture = await prisma.Lecture.findUnique({
    where: {
      lecture_id: target_id,
    },
    include: {
      days: {
        select: {
          day: true,
        },
      },
    },
  });

  if (!targetLecture) {
    return next(
      new CustomError(
        "유효하지 않은 입력입니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // 전달되지 않은 필드에 대해 기본값 설정
  if (!lecture_name) lecture_name = targetLecture.lecture_name;
  if (!teacher_id) teacher_id = targetLecture.teacher_id;
  if (!day) day = targetLecture.days.map((dayObj) => dayObj.day); // days가 없으면 기존 days 사용

  // 시간 처리
  // time은 "14:00"형식으로 입력받음(String)
  if (!start_time) {
    start_time = targetLecture.start_time;
  } else {
    const [start_hours, start_minutes] = start_time.split(":");
    start_time = new Date();
    start_time.setHours(start_hours, start_minutes, 0, 0);
  }
  if (!end_time) {
    end_time = targetLecture.end_time;
  } else {
    const [end_hours, end_minutes] = end_time.split(":");
    end_time = new Date();
    end_time.setHours(end_hours, end_minutes, 0, 0);
  }

  // 해당 강의에 연결된 모든 LectureDay 삭제
  await prisma.LectureDay.deleteMany({
    where: {
      lecture_id: target_id,
    },
  });

  // 강의 수정 및 새로운 LectureDay 관계 생성
  const result = await prisma.Lecture.update({
    where: {
      lecture_id: target_id,
    },
    data: {
      lecture_name: lecture_name,
      teacher_id: teacher_id,
      start_time: start_time,
      end_time: end_time,
      days: {
        create: day.map((dayValue) => ({
          day: dayValue, // 새로운 LectureDay 데이터를 생성
        })),
      },
    },
    include: {
      days: true, // 업데이트된 days 반환
    },
  });

  return res.status(StatusCodes.OK).json({
    message: "수정이 성공적으로 완료되었습니다.",
    data: result,
  });
});

//강의 삭제
exports.deleteLecture = asyncWrapper(async (req, res, next) => {
  let { lecture_id } = req.params;

  // lecture_id가 존재하지 않으면 에러 처리
  if (!lecture_id) {
    return next(
      new CustomError(
        "유효한 lecture_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const target_id = parseInt(lecture_id, 10);

  const targetLecture = await prisma.Lecture.findUnique({
    where: {
      lecture_id: target_id,
    },
  });

  if (!targetLecture) {
    return next(
      new CustomError(
        "유효하지 않은 입력입니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  await prisma.Lecture.delete({
    where: {
      lecture_id: target_id,
    },
  });

  return res.status(StatusCodes.OK).json({
    message: "삭제가 성공적으로 완료되었습니다.",
    lecture_id: target_id,
  });
});

//강의 수강생 조회
exports.getLectureStudent = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;
  const target_id = parseInt(lecture_id, 10);

  if (!lecture_id) {
    return next(
      new CustomError(
        "유효한 lecture_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  if (!target_id) {
    return next(
      new CustomError(
        "유효한 lecture_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const result = await prisma.LectureParticipant.findMany({
    where: {
      lecture_id: target_id,
    },
    include: {
      user: {
        select: {
          user_id: true,
          user_name: true,
          email: true,
          phone_number: true,
        },
      },
    },
  });

  if (!result || result.length === 0) {
    return next(
      new CustomError(
        "수강생이 없거나 불러올 수 없습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }

  // lecture_id와 user_id를 제외하고 수강생 정보를 가공
  const students = result.map((participant) => ({
    user_id: participant.user.user_id,
    user_name: participant.user.user_name,
    email: participant.user.email,
    phone_number: participant.user.phone_number,
  }));

  return res.status(StatusCodes.OK).json({
    message: "수강생을 성공적으로 불러왔습니다.",
    lecture_id: target_id,
    data: students,
  });
});

//강의 수강생 추가
exports.createLectureStudent = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;

  if (!lecture_id) {
    return next(
      new CustomError(
        "유효한 lecture_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const { user_id } = req.body;

  if (!user_id) {
    return next(
      new CustomError(
        "유효한 user_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const target_id = parseInt(lecture_id, 10);

  try {
    const result = await prisma.LectureParticipant.create({
      data: {
        lecture_id: target_id,
        user_id: user_id,
      },
    });

    // 현재 수강생 수를 다시 조회하여 headcount 업데이트
    const participantCount = await prisma.LectureParticipant.count({
      where: {
        lecture_id: target_id,
      },
    });

    // 수강생 수 업데이트
    await prisma.Lecture.update({
      where: {
        lecture_id: target_id,
      },
      data: {
        headcount: participantCount,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "수강생을 성공적으로 추가했습니다.",
      data: result,
    });
  } catch (error) {
    throw new CustomError(
      "수강생을 추가하는데 실패하였습니다.",
      StatusCodes.INTERNAL_SERVER_ERROR,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
});

//강의 수강생 제거
exports.deleteLectureStudent = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;

  if (!lecture_id) {
    return next(
      new CustomError(
        "유효한 lecture_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const target_id = parseInt(lecture_id, 10);

  const { user_id } = req.body;

  if (!user_id) {
    return next(
      new CustomError(
        "유효한 user_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  try {
    const result = await prisma.LectureParticipant.delete({
      where: {
        lecture_id_user_id: {
          lecture_id: target_id,
          user_id: user_id,
        },
      },
    });

    // 현재 수강생 수를 다시 조회하여 headcount 업데이트
    const participantCount = await prisma.LectureParticipant.count({
      where: {
        lecture_id: target_id,
      },
    });

    // 수강생 수 업데이트
    await prisma.Lecture.update({
      where: {
        lecture_id: target_id,
      },
      data: {
        headcount: participantCount,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "수강생을 성공적으로 삭제했습니다.",
      data: result,
    });
  } catch (error) {
    throw new CustomError(
      "수강생을 삭제하는데 실패하였습니다.",
      StatusCodes.INTERNAL_SERVER_ERROR,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
});

exports.createExam = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;
  const { exam_name, exam_type_id, exam_date } = req.body;

  // 유효성 검사: lecture_id, exam_type_id가 존재하지 않으면 에러 처리
  if (
    !lecture_id ||
    !exam_name ||
    !exam_name.trim() ||
    !exam_date ||
    !exam_date.trim() ||
    !exam_type_id ||
    !exam_type_id.trim()
  ) {
    return next(
      new CustomError(
        "유효한 lecture_id, exam_name, exam_type_id, exam_date가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const lecture_id_int = parseInt(lecture_id, 10);
  const exam_type_id_int = parseInt(exam_type_id, 10);

  // 유효성 검사: 존재하는 exam_type_id인지 확인
  const exam_type = await prisma.ExamType.findUnique({
    where: {
      exam_type_id: exam_type_id_int,
    },
  });

  if (!exam_type) {
    return next(
      new CustomError(
        "존재하지 않는 시험 유형입니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const exam = await prisma.Exam.create({
    data: {
      lecture_id: lecture_id_int,
      exam_name: exam_name,
      exam_date: new Date(exam_date),
      exam_type_id: exam_type_id_int,
    },
  });
  return res.status(StatusCodes.CREATED).json({
    message: "시험이 성공적으로 생성되었습니다.",
    data: exam,
  });
});

exports.getExam = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;
  const { exam_type_id } = req.query;

  // 유효성 검사: lecture_id가 존재하지 않으면 에러 처리
  if (!lecture_id) {
    return next(
      new CustomError(
        "유효한 lecture_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const lecture_id_int = parseInt(lecture_id, 10);

  // Prisma where 조건 동적 구성
  const whereCondition = {
    lecture_id: lecture_id_int,
    ...(exam_type_id && { exam_type_id: parseInt(exam_type_id, 10) }), // exam_type_id가 존재할 경우 조건 추가
  };

  const examList = await prisma.Exam.findMany({
    where: whereCondition,
  });

  // 유효성 검사: 존재하는 시험이 있는지 확인
  if (!examList || examList.length === 0) {
    return next(
      new CustomError(
        "현재 개설된 시험이 존재하지 않습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }

  return res.status(StatusCodes.OK).json({
    message: "시험을 성공적으로 불러왔습니다.",
    data: {
      lecture_id: lecture_id_int,
      exam_type_id: exam_type_id,
      exams: examList,
      exam_cnt: examList.length,
    },
  });
});

exports.deleteExam = asyncWrapper(async (req, res, next) => {
  const { lecture_id, exam_id } = req.params;

  // 유효성 검사: lecture_id, exam_id가 존재하지 않으면 에러 처리
  if (!lecture_id || !exam_id || !exam_id.trim()) {
    return next(
      new CustomError(
        "유효한 lecture_id, exam_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const lecture_id_int = parseInt(lecture_id, 10);
  const exam_id_int = parseInt(exam_id, 10);

  const targetExam = await prisma.Exam.findUnique({
    where: {
      lecture_id: lecture_id_int,
      exam_id: exam_id_int,
    },
  });

  if (!targetExam) {
    return next(
      new CustomError(
        "존재하지 않는 시험입니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // 시험 삭제, 참조된 데이터들(ExamUserScore)도 삭제 - onDelete: CASCADE
  await prisma.Exam.delete({
    where: {
      exam_id: exam_id_int,
    },
  });

  return res.status(StatusCodes.OK).json({
    message: "시험 삭제가 완료되었습니다.",
    data: {
      lecture_id: lecture_id_int,
      exam: targetExam,
    },
  });
});

exports.createScore = asyncWrapper(async (req, res, next) => {
  const { lecture_id, exam_id } = req.params;
  let { scoreList } = req.body;
  // 유효성 검사: lecture_id, exam_id, user_id가 존재하지 않으면 에러 처리
  if (!lecture_id || !exam_id || !scoreList || scoreList.length === 0) {
    return next(
      new CustomError(
        "유효한 lecture_id, exam_id, user_id, score가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const lecture_id_int = parseInt(lecture_id, 10);
  const exam_id_int = parseInt(exam_id, 10);

  const exam = await prisma.Exam.findUnique({
    where: {
      exam_id: exam_id_int,
    },
  });

  // 아래의 유효성 검사는 삭제했음. 이 함수는 화면단에서 처리된 데이터를 받아서 처리하는 함수이기 때문에.
  // 존재하는 lecture_id, exam_id, user_id인지 확인  / 해당 강의에 수강생으로 등록되어 있는 user_id인지 확인

  // 유효성 검사
  for (let i = 0; i < scoreList.length; i++) {
    // score가 0~100 사이의 값인지 확인
    if (!scoreList[i].score) {
      scoreList[i].score = 0;
    } else if (scoreList[i].score < 0 || scoreList[i].score > 100) {
      return next(
        new CustomError(
          `${score}는 유효하지 않은 score입니다.`,
          StatusCodes.BAD_REQUEST,
          StatusCodes.BAD_REQUEST
        )
      );
    }
  }
  // 성적 일괄 입력
  for (let i = 0; i < scoreList.length; i++) {
    await prisma.ExamUserScore.upsert({
      where: {
        exam_id_user_id: {
          exam_id: exam_id_int,
          user_id: scoreList[i].user_id,
        },
      },
      update: {
        score: scoreList[i].score, // 이미 있으면 업데이트
      },
      create: {
        exam_id: exam_id_int,
        user_id: scoreList[i].user_id,
        score: scoreList[i].score, // 없으면 새로 생성
      },
    });
  }

  // ExamUserScore에서 모든 데이터를 조회하여 합산 및 평균 계산
  const scores = await prisma.ExamUserScore.findMany({
    where: {
      exam_id: exam_id_int,
    },
    select: {
      score: true,
    },
  });

  const newHeadcount = scores.length;
  const sumScore = scores.reduce((sum, record) => sum + record.score, 0);
  const minScore = Math.min(...scores.map((record) => record.score));
  const maxScore = Math.max(...scores.map((record) => record.score));

  // 대표값 업데이트
  await prisma.Exam.update({
    where: {
      exam_id: exam_id_int,
    },
    data: {
      low_score: minScore,
      high_score: maxScore,
      average_score: sumScore / (newHeadcount || 1),
      total_score: sumScore,
      headcount: newHeadcount,
    },
  });

  // 대표값 업데이트
  await prisma.Exam.update({
    where: {
      exam_id: exam_id_int,
    },
    data: {
      low_score: minScore,
      high_score: maxScore,
      average_score: sumScore / (newHeadcount || 1),
      total_score: sumScore,
      headcount: newHeadcount,
    },
  });

  return res.status(StatusCodes.CREATED).json({
    message: "성적이 성공적으로 입력되었습니다.",
    data: {
      exam_id: exam_id_int,
      scoreList: scoreList,
    },
  });
});

exports.getExamScore = asyncWrapper(async (req, res, next) => {
  const { lecture_id, exam_id } = req.params;
  // 유효성 검사: lecture_id, exam_id, user_id가 존재하지 않으면 에러 처리
  if (!lecture_id || !exam_id) {
    return next(
      new CustomError(
        "유효한 lecture_id, exam_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const exam_id_int = parseInt(exam_id, 10);

  const examUserScore = await prisma.ExamUserScore.findMany({
    where: {
      exam_id: exam_id_int,
    },
  });

  if (!examUserScore || examUserScore.length === 0) {
    return next(
      new CustomError(
        "성적이 존재하지 않습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }

  const scoreList = examUserScore.map((row) => {
    return { user_id: row.user_id, score: row.score };
  });

  console.log(scoreList);

  return res.status(StatusCodes.OK).json({
    message: "성적을 성공적으로 불러왔습니다.",
    data: {
      exam_id: exam_id_int,
      scoreList: scoreList,
      headcount: scoreList.length,
    },
  });
});

exports.modifyScore = asyncWrapper(async (req, res, next) => {
  const { lecture_id, exam_id } = req.params;
  const { user_id, score } = req.body;

  // 유효성 검사: lecture_id, exam_id, user_id가 존재하지 않으면 에러 처리
  if (!lecture_id || !exam_id || !user_id || !user_id.trim()) {
    return next(
      new CustomError(
        "유효한 lecture_id, exam_id, user_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const lecture_id_int = parseInt(lecture_id, 10);
  const exam_id_int = parseInt(exam_id, 10);

  // score가 0~100 사이의 값인지 확인
  if (score < 0 || score > 100) {
    return next(
      new CustomError(
        `${score}는 유효하지 않은 score입니다.`,
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const exam = await prisma.Exam.findUnique({
    where: {
      exam_id: exam_id_int,
    },
  });

  const currentScore = await prisma.ExamUserScore.findUnique({
    where: {
      exam_id_user_id: {
        exam_id: exam_id_int,
        user_id: user_id,
      },
    },
  });
  // 동일한 점수이면 변경하지 않음
  if (currentScore.score == score) {
    return res.status(StatusCodes.OK).json({
      message: "성적이 변경되지 않았습니다.",
      data: currentScore,
    });
  }

  const updatedScore = await prisma.ExamUserScore.update({
    where: {
      exam_id_user_id: {
        exam_id: exam_id_int,
        user_id: user_id,
      },
    },
    data: {
      score: score,
    },
  });

  // 대표값 계산
  const minScore = await prisma.ExamUserScore.findFirst({
    where: { exam_id: exam_id_int },
    select: { score: true },
    orderBy: { score: "asc" },
  });

  const maxScore = await prisma.ExamUserScore.findFirst({
    where: { exam_id: exam_id_int },
    select: { score: true },
    orderBy: { score: "desc" },
  });
  console.log(minScore, maxScore);
  let sumScore = exam.total_score;

  sumScore -= currentScore.score;
  sumScore += score;
  const averageScore = sumScore / exam.headcount;

  await prisma.Exam.update({
    where: {
      exam_id: exam_id_int,
    },
    data: {
      low_score: minScore.score,
      high_score: maxScore.score,
      total_score: sumScore,
      average_score: new Prisma.Decimal(averageScore),
    },
  });

  return res.status(StatusCodes.OK).json({
    message: "성적이 성공적으로 수정되었습니다.",
    data: {
      updatedScore: updatedScore,
      exam: {
        low_score: minScore.score,
        high_score: maxScore.score,
        average_score: averageScore,
        total_score: sumScore,
      },
    },
  });
});
exports.getExamTypeScore = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;
  const user_id = req.query.user_id;
  const exam_type_id = req.query.exam_type_id;
  const asc = req.query.asc;

  if (!lecture_id || !user_id || !exam_type_id) {
    return next(
      new CustomError(
        "유효한 lecture_id, user_id, exam_type_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  console.log(typeof exam_type_id);
  const lecture_id_int = parseInt(lecture_id, 10);
  const exam_type_id_int = parseInt(exam_type_id, 10);

  // ExamType과 관련된 Exam 데이터를 include로 가져옴
  const exams_info = await prisma.ExamType.findUnique({
    where: {
      exam_type_id: exam_type_id_int,
    },
    include: {
      exams: {
        where: {
          // lecture_id가 0이면  exam_type_id만으로(전과목) 검색, 아니면 둘 다 검색
          ...(lecture_id_int === 0
            ? { exam_type_id: exam_type_id_int }
            : {
                lecture_id: lecture_id_int,
                exam_type_id: exam_type_id_int,
              }),
        },
        select: {
          exam_id: true,
          exam_name: true,
          exam_date: true,
          // 전과목 검색 시 lecture_id도 가져옴
          ...(lecture_id_int === 0
            ? {
                lecture_id: true,
              }
            : {}),
        },
        orderBy: {
          exam_date: asc === "true" ? "asc" : "desc",
        },
      },
    },
  });

  if (!exams_info || !exams_info.exams.length) {
    return next(
      new CustomError(
        "해당 시험 유형의 성적을 찾을 수 없습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }

  // Promise.all로 모든 비동기 작업을 처리
  // -> map와 같이 사용하면 DB에서 데이터를 가져오는 작업을 병렬로 처리 가능. 속도 향상
  // 또한 filtered로 점수가 없을 때 반환안하게 구현
  const exams_data = (
    await Promise.all(
      exams_info.exams.map(async (exam) => {
        const exam_score = await prisma.ExamUserScore.findFirst({
          where: {
            exam_id: exam.exam_id,
            user_id: user_id,
          },
        });

        // exam_score가 null이 아니면 반환, null이면 undefined 반환
        return exam_score
          ? {
              exam_id: exam.exam_id,
              exam_name: exam.exam_name,
              exam_date: exam.exam_date,
              score: exam_score.score,
              ...(lecture_id_int === 0 ? { lecture_id: exam.lecture_id } : {}),
            }
          : undefined;
      })
    )
  ).filter(Boolean); // undefined 값 제거

  return res.status(StatusCodes.OK).json({
    message: `${user_id}의 성적을 성공적으로 불러왔습니다.`,
    data: {
      user_id: user_id,
      lecture_id: lecture_id_int,
      asc: asc === "true",
      exam_data: {
        exam_type: {
          exam_type_id: exam_type_id_int,
          exam_type_name: exams_info.exam_type_name,
        },
        exam_list: exams_data,
      },
    },
  });
});

exports.putLectureStudent = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;

  if (!lecture_id) {
    return next(
      new CustomError(
        "유효한 lecture_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const { studentList } = req.body;

  if (!Array.isArray(studentList)) {
    return next(
      new CustomError(
        "유효한 수강생 목록이 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const targetLectureId = parseInt(lecture_id, 10);

  // 데이터베이스에서 해당 강의 확인
  const lectureExists = await prisma.lecture.findUnique({
    where: { lecture_id: targetLectureId },
  });

  if (!lectureExists) {
    return next(
      new CustomError(
        "강의를 찾을 수 없습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }

  try {
    // 기존 수강생 목록 조회
    const existingStudents = await prisma.LectureParticipant.findMany({
      where: { lecture_id: targetLectureId },
      select: { user_id: true },
    });

    // 기존 수강생 user_id 목록과 요청받은 studentList로 업데이트할 목록 구분
    const existingStudentIds = existingStudents.map(
      (student) => student.user_id
    );
    const newStudents = studentList.filter(
      (userId) => !existingStudentIds.includes(userId)
    );
    const studentsToRemove = existingStudentIds.filter(
      (userId) => !studentList.includes(userId)
    );

    // 새로운 수강생 추가
    if (newStudents.length > 0) {
      await prisma.LectureParticipant.createMany({
        data: newStudents.map((userId) => ({
          lecture_id: targetLectureId,
          user_id: userId,
        })),
      });
    }

    // 삭제할 수강생 제거
    if (studentsToRemove.length > 0) {
      await prisma.LectureParticipant.deleteMany({
        where: {
          lecture_id: targetLectureId,
          user_id: { in: studentsToRemove },
        },
      });
    }

    // 현재 수강생 수를 다시 조회하여 headcount 업데이트
    const participantCount = await prisma.LectureParticipant.count({
      where: {
        lecture_id: target_id,
      },
    });

    // 수강생 수 업데이트
    await prisma.Lecture.update({
      where: {
        lecture_id: target_id,
      },
      data: {
        headcount: participantCount,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "수강생 목록이 성공적으로 업데이트되었습니다.",
      addedStudents: newStudents,
      removedStudents: studentsToRemove,
    });
  } catch (error) {
    return next(
      new CustomError(
        "수강생 목록을 업데이트하는데 실패하였습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  }
});
