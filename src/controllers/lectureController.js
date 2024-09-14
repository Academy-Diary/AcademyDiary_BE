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
