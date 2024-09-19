const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");

//학원내의 모든 강의 조회
exports.getLecture = asyncWrapper(async (req, res, next) => {
  const { academy_id } = req.body;

  if (!academy_id) {
    return next(
      new CustomError(
        "유효한 academy_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const LectureList = await prisma.Lecture.findMany({
    where: {
      academy_id: academy_id,
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

  res.status(StatusCodes.OK).json({
    message: "강의를 성공적으로 불러왔습니다.",
    data: LectureList,
  });
});

//강의 생성
exports.createLecture = asyncWrapper(async (req, res, next) => {
  const { lecture_name, user_id, academy_id } = req.body;

  if (!lecture_name || lecture_name.length === 0 || !user_id || !academy_id) {
    return next(
      new CustomError(
        "유효하지 않은 입력입니다!",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const result = await prisma.Lecture.create({
    data: {
      lecture_name,
      teacher_id: user_id,
      academy_id,
    },
  });

  res.status(StatusCodes.OK).json({
    message: "새로운 강의가 생성되었습니다!",
    lecture: result,
  });
});

//강의 수정
exports.modifyLecture = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;
  const { lecture_name, teacher_id } = req.body;

  if (!lecture_id || !lecture_name || !teacher_id) {
    return next(
      new CustomError(
        "유효하지 않은 입력입니다.",
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

  const result = await prisma.Lecture.update({
    where: {
      lecture_id: target_id,
    },
    data: {
      lecture_name: lecture_name,
      teacher_id: teacher_id,
    },
  });

  res.status(StatusCodes.OK).json({
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

  res.status(StatusCodes.OK).json({
    message: "삭제가 성공적으로 완료되었습니다.",
    lecture_id: target_id,
  });
});

exports.createExamType = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;
  const { exam_type_name } = req.body;

  // 유효성 검사1: lecture_id, exam_type_name이 존재하지 않으면 에러 처리
  if (!lecture_id || !exam_type_name || !exam_type_name.trim()) {
    return next(
      new CustomError(
        "lecture_id, exam_type_name 모두 입력해주세요.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const lecture_id_int = parseInt(lecture_id, 10);

  // 유효성 검사2: 이미 존재하는 exam_type_name인지 확인
  const isExist = await prisma.ExamType.findFirst({
    where: {
      exam_type_name,
      lecture_id: lecture_id_int,
    },
  });
  if (isExist) {
    return next(
      new CustomError(
        "이미 존재하는 시험 유형입니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const examType = await prisma.ExamType.create({
    data: {
      exam_type_name,
      lecture_id: lecture_id_int,
    },
  });
  res.status(StatusCodes.CREATED).json({
    message: "시험 유형이 성공적으로 생성되었습니다.",
    data: examType,
  });
});

exports.getExamType = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;

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

  const examTypeList = await prisma.ExamType.findMany({
    where: {
      lecture_id: lecture_id_int,
    },
  });

  if (!examTypeList || examTypeList.length === 0) {
    return next(
      new CustomError(
        "현재 개설된 시험 유형이 존재하지 않습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }

  res.status(StatusCodes.OK).json({
    message: "시험 유형을 성공적으로 불러왔습니다.",
    data: {
      lecture_id: lecture_id_int,
      exam_types: examTypeList,
      type_cnt: examTypeList.length,
    },
  });
});

exports.deleteExamType = asyncWrapper(async (req, res, next) => {
  const { lecture_id, exam_type_id } = req.params;

  // 유효성 검사: lecture_id, exam_type_id가 존재하지 않으면 에러 처리
  if (!lecture_id || !exam_type_id || !exam_type_id.trim()) {
    return next(
      new CustomError(
        "유효한 lecture_id, exam_type_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const lecture_id_int = parseInt(lecture_id, 10);
  const exam_type_id_int = parseInt(exam_type_id, 10);

  const targetExamType = await prisma.ExamType.findUnique({
    where: {
      lecture_id: lecture_id_int,
      exam_type_id: exam_type_id_int,
    },
  });

  if (!targetExamType) {
    return next(
      new CustomError(
        "존재하지않는 시험 유형입니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  await prisma.ExamType.delete({
    where: {
      exam_type_id: exam_type_id_int,
    },
  });

  res.status(StatusCodes.OK).json({
    message: "시험 유형 삭제가 완료되었습니다.",
    data: {
      lecture_id: lecture_id_int,
      exam_type_name: targetExamType.exam_type_name,
      exam_type_id: exam_type_id_int,
    },
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

  res.status(StatusCodes.OK).json({
    message: "수강생을 성공적으로 불러왔습니다.",
    data: result,
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

    res.status(StatusCodes.OK).json({
      message: "수강생을 성공적으로 추가했습니다.",
      data: result,
    });
  } catch (error) {
    return next(
      new CustomError(
        "수강생을 추가하는데 실패하였습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
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

    res.status(StatusCodes.OK).json({
      message: "수강생을 성공적으로 삭제했습니다.",
      data: result,
    });
  } catch (error) {
    return next(
      new CustomError(
        "수강생을 삭제하는데 실패하였습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
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
      lecture_id: lecture_id_int,
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
  res.status(StatusCodes.CREATED).json({
    message: "시험이 성공적으로 생성되었습니다.",
    data: exam,
  });
});

exports.getExam = asyncWrapper(async (req, res, next) => {
  const { lecture_id } = req.params;

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

  const examList = await prisma.Exam.findMany({
    where: {
      lecture_id: lecture_id_int,
    },
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

  res.status(StatusCodes.OK).json({
    message: "시험을 성공적으로 불러왔습니다.",
    data: {
      lecture_id: lecture_id_int,
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

  res.status(StatusCodes.OK).json({
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
  let minScore = 100,
    maxScore = 0,
    sumScore = 0;
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

  // 유효성 검사: 존재하는 lecture_id, exam_id, user_id인지 확인
  const lecture = await prisma.Lecture.findUnique({
    where: {
      lecture_id: lecture_id_int,
    },
  });
  const exam = await prisma.Exam.findUnique({
    where: {
      exam_id: exam_id_int,
    },
  });

  if (!lecture || !exam) {
    return next(
      new CustomError(
        "존재하지 않는 lecture_id, exam_id 입니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }

  // 유효성 검사
  for (let i = 0; i < scoreList.length; i++) {
    const { user_id, score } = scoreList[i];
    // 존재하는 user_id인지 확인
    if (
      (await prisma.User.findUnique({ where: { user_id: user_id } })) === null
    ) {
      return next(
        new CustomError(
          `${user_id}는 존재하지 않는 user_id입니다.`,
          StatusCodes.NOT_FOUND,
          StatusCodes.NOT_FOUND
        )
      );
    }
    // 해당 강의에 수강생으로 등록되어 있는 user_id인지 확인
    if (
      (await prisma.LectureParticipant.findFirst({
        where: { lecture_id: lecture_id_int, user_id: user_id },
      })) === null
    ) {
      return next(
        new CustomError(
          `${user_id}는 해당 강의에 수강생으로 등록되어 있지 않은 user_id입니다.`,
          StatusCodes.INTERNAL_SERVER_ERROR,
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
    // score가 0~100 사이의 값인지 확인
    if (!score) {
      scoreList[0].score = 0;
    } else if (score < 0 || score > 100) {
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
    // 대표값 계산
    if (minScore > scoreList[i].score) minScore = scoreList[i].score;
    if (maxScore < scoreList[i].score) maxScore = scoreList[i].score;
    sumScore += scoreList[i].score;
  }
  await prisma.Exam.update({
    where: {
      exam_id: exam_id_int,
    },
    data: {
      low_score: minScore,
      high_score: maxScore,
      average_score: sumScore / scoreList.length,
      total_score: sumScore,
    },
  });

  res.status(StatusCodes.CREATED).json({
    message: "성적이 성공적으로 입력되었습니다.",
    data: {
      exam_id: exam_id_int,
      scoreList: scoreList,
    },
  });
});
