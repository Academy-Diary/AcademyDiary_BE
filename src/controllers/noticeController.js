const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { Status, Role } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

exports.createNotice = asyncWrapper(async (req, res, next) => {
  const { title, content } = req.body;
  const lecture_id = parseInt(req.body.lecture_id, 10);
  const academy_id = req.user.academy_id;
  const user_id = req.user.user_id;

  if (!title || !content || isNaN(lecture_id)) {
    console.log(title, content, academy_id, lecture_id);
    return next(
      new CustomError(
        "유효한 값들을 입력해주세요.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const recent_notice = await prisma.Notice.findFirst({
    where: { academy_id, lecture_id },
    orderBy: { notice_num: "desc" },
  });
  const recent_notice_num = recent_notice ? recent_notice.notice_num : 0;

  const dirPath = path.join(
    __dirname,
    "/../../public/notice",
    academy_id,
    lecture_id.toString(),
    (recent_notice_num + 1).toString()
  );

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const files = req.files.map((file) => {
    const oldPath = file.path;
    const newPath = path.join(dirPath, file.originalname);
    try {
      fs.renameSync(oldPath, newPath);
      console.log(`파일 이동 성공: ${oldPath} -> ${newPath}`);
    } catch (error) {
      console.error(`파일 이동 실패: ${error}`);
      return next(
        new CustomError(
          "파일 이동 중 오류가 발생했습니다.",
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
    return {
      path: newPath,
      originalname: file.originalname,
    };
  });

  console.log("이동 후 파일 경로:", files);

  const notice = await prisma.Notice.create({
    data: {
      title,
      content,
      academy_id,
      lecture_id,
      user_id,
      notice_num: recent_notice_num + 1,
      notice_id: `${academy_id}_${lecture_id}_${recent_notice_num + 1}`,
    },
  });

  await prisma.NoticeFile.createMany({
    data: files.map((file) => ({
      notice_id: notice.notice_id,
      file: file.path,
    })),
  });

  return res.status(StatusCodes.CREATED).json({
    message: "공지사항이 성공적으로 생성되었습니다.",
    data: {
      notice,
      files: files.map((file) => file.originalname),
    },
  });
});

// 공지 리스트 조회
exports.getNoticeList = asyncWrapper(async (req, res, next) => {
  const academy_id = req.user.academy_id;
  const lecture_id = parseInt(req.query.lecture_id, 10);
  const page = parseInt(req.query.page, 10);
  const page_size = parseInt(req.query.page_size, 10);
  // 유효성 검사1: 값들이 존재하지 않으면 에러 처리
  if (isNaN(lecture_id) || isNaN(page) || isNaN(page_size)) {
    return next(
      new CustomError(
        "유효한 값들을 입력해주세요.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const skip = (page - 1) * page_size;

  const notices = await prisma.Notice.findMany({
    skip: skip,
    take: page_size,
    where: {
      academy_id: academy_id,
      lecture_id: lecture_id,
    },
    orderBy: {
      notice_num: "desc",
    },
  });

  const resData = notices.map((notice) => {
    return {
      title: notice.title,
      content: notice.content,
      user_id: notice.user_id,
      views: notice.views,
      notice_id: notice.notice_id,
    };
  });
  return res.status(StatusCodes.OK).json({
    message: "공지사항 목록 조회에 성공했습니다.",
    data: resData,
  });
});
