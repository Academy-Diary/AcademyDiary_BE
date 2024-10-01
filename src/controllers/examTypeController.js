const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");

exports.createExamType = asyncWrapper(async (req, res, next) => {
  const { academy_id, exam_type_name } = req.body;

  // 유효성 검사1: academy_id가 다른 학원이면 에러 처리
  if (academy_id !== req.user.academy_id) {
    return next(
      new CustomError(
        "다른 학원에는 접근할 수 없습니다.",
        StatusCodes.FORBIDDEN,
        StatusCodes.FORBIDDEN
      )
    );
  }
  // 유효성 검사2:  exam_type_name이 존재하지 않으면 에러 처리
  if (!exam_type_name || !exam_type_name.trim()) {
    return next(
      new CustomError(
        "exam_type_name 모두 입력해주세요.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // 유효성 검사3: 이미 존재하는 exam_type_name인지 확인
  const isExist = await prisma.ExamType.findFirst({
    where: {
      academy_id: academy_id,
      exam_type_name: exam_type_name,
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
      academy_id: academy_id,
      exam_type_name: exam_type_name,
    },
  });
  return res.status(StatusCodes.CREATED).json({
    message: "시험 유형이 성공적으로 생성되었습니다.",
    data: examType,
  });
});

exports.getExamType = asyncWrapper(async (req, res, next) => {
  const { academy_id } = req.params;

  // 유효성 검사1: academy_id가 다른 학원이면 에러 처리
  if (academy_id !== req.user.academy_id) {
    return next(
      new CustomError(
        "다른 학원에는 접근할 수 없습니다.",
        StatusCodes.FORBIDDEN,
        StatusCodes.FORBIDDEN
      )
    );
  }

  const examTypeList = await prisma.ExamType.findMany({
    where: {
      academy_id: academy_id,
    },
  });

  // 유효성 검사2: examTypeList가 존재하지 않으면 에러 처리
  if (!examTypeList || examTypeList.length === 0) {
    return next(
      new CustomError(
        "현재 개설된 시험 유형이 존재하지 않습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }
  const examTypes = examTypeList.map((x) => ({
    exam_type_name: x.exam_type_name,
    exam_type_id: x.exam_type_id,
  }));

  return res.status(StatusCodes.OK).json({
    message: "시험 유형을 성공적으로 불러왔습니다.",
    data: {
      academy_id: academy_id,
      type_cnt: examTypeList.length,
      exam_types: examTypes,
    },
  });
});

exports.deleteExamType = asyncWrapper(async (req, res, next) => {
  const { exam_type_id } = req.params;
  const { academy_id } = req.body;

  // 유효성 검사1: academy_id가 다른 학원이면 에러 처리
  if (academy_id !== req.user.academy_id) {
    return next(
      new CustomError(
        "다른 학원에는 접근할 수 없습니다.",
        StatusCodes.FORBIDDEN,
        StatusCodes.FORBIDDEN
      )
    );
  }
  // 유효성 검사2: exam_type_id가 존재하지 않으면 에러 처리
  if (!exam_type_id || !exam_type_id.trim()) {
    return next(
      new CustomError(
        "유효한 exam_type_id가 제공되지 않았습니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const exam_type_id_int = parseInt(exam_type_id, 10);

  // examType 삭제, 실패 시 에러 처리
  const deletedExamType = await prisma.ExamType.delete({
    where: {
      academy_id: academy_id,
      exam_type_id: exam_type_id_int,
    },
  }).catch((err) => {
    // console.log(err);
    if (err.code === "P2025") {
      throw new CustomError(
        "존재하지않는 시험 유형입니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      );
    } else {
      throw new CustomError(
        "시험 유형 삭제에 실패했습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  });

  return res.status(StatusCodes.OK).json({
    message: "시험 유형 삭제가 완료되었습니다.",
    data: deletedExamType,
  });
});
