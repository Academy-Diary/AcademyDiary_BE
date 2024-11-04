const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { Status, Role } = require("@prisma/client");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink); // fs.unlink을 Promise 기반으로 변환
const path = require("path");
const { S3_BUCKET_NAME } = require("../config/secret");
const {
  uploadDirToS3,
  deleteFilesFromS3,
} = require("../lib/middlewares/handlingFile");

exports.createNotice = asyncWrapper(async (req, res, next) => {
  const { title, content } = req.body;
  const notice_id = req.body.notice_id.split("&");
  const academy_id = notice_id[0];
  const lecture_id = parseInt(notice_id[1], 10);
  const notice_num = parseInt(notice_id[2], 10);
  const user_id = req.user.user_id;

  // 유효성 검사1: 필수 값들이 존재하지 않거나 notice_id가 올바른 형식아 아니면.
  if (!title || !content || !academy_id || !lecture_id || !notice_num) {
    return next(
      new CustomError(
        "유효한 값들을 입력해주세요.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // 유효성 검사2: 다른 학원의 공지를 생성하려고 하는 경우 에러 처리
  if (academy_id !== req.user.academy_id) {
    return next(
      new CustomError(
        "해당 학원에 대한 권한이 없습니다.",
        StatusCodes.FORBIDDEN,
        StatusCodes.FORBIDDEN
      )
    );
  }

  // 공지 생성
  const notice = await prisma.Notice.create({
    data: {
      title,
      content,
      academy_id,
      lecture_id,
      user_id,
      notice_num,
      notice_id: req.body.notice_id,
    },
  });

  // 파일이 있는지 확인 후 처리
  const files = req.files && req.files.length > 0 ? req.files : [];
  console.log(files);
  if (files.length > 0) {
    await prisma.NoticeFile.createMany({
      data: files.map((file) => ({
        notice_id: notice.notice_id,
        path: file.location,
        name: file.originalname,
      })),
    });
  }

  return res.status(StatusCodes.CREATED).json({
    message: "공지사항이 성공적으로 생성되었습니다.",
    data: {
      notice,
      files: files.map((file) => ({
        url: file.location,
        name: file.originalname,
      })),
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

exports.deleteNotice = asyncWrapper(async (req, res, next) => {
  const notice_id = req.params.notice_id.split("&");
  const academy_id = notice_id[0];
  const lecture_id = parseInt(notice_id[1], 10);
  const notice_num = parseInt(notice_id[2], 10);

  // 유효성 검사1: 값들이 존재하지 않으면 에러 처리
  if (isNaN(lecture_id) || isNaN(notice_num)) {
    return next(
      new CustomError(
        "유효한 값들을 입력해주세요.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // 유효성 검사2: 다른 학원의 공지를 삭제하려고 하는 경우 에러 처리
  if (academy_id !== req.user.academy_id) {
    return next(
      new CustomError(
        "해당 학원에 대한 권한이 없습니다.",
        StatusCodes.FORBIDDEN,
        StatusCodes.FORBIDDEN
      )
    );
  }

  const notice = await prisma.Notice.findFirst({
    where: {
      notice_id: req.params.notice_id,
    },
  });

  // 유효성 검사3: 해당 공지사항이 존재하지 않으면 에러 처리
  if (!notice) {
    return next(
      new CustomError(
        "해당 공지사항이 존재하지 않습니다.",
        StatusCodes.NOT_FOUND,
        StatusCodes.NOT_FOUND
      )
    );
  }

  const notice_files = await prisma.NoticeFile.findMany({
    where: {
      notice_id: req.params.notice_id,
    },
  });

  // Notice 삭제, NoticeFile은 cascade로 삭제됨
  const notice = await prisma.Notice.delete({
    where: {
      notice_id: req.params.notice_id,
    },
  });

  // S3 경로 설정 및 전체 디렉토리 삭제
  const bucketName = S3_BUCKET_NAME;
  const s3Prefix = `public/notice/${academy_id}/${lecture_id}/${notice_num}/`;

  try {
    await deleteFilesFromS3(bucketName, s3Prefix); // 전체 디렉토리 삭제
  } catch (error) {
    return next(
      new CustomError(
        "S3 디렉토리 삭제 중 오류가 발생했습니다.",
        ErrorCode.S3_DELETE_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  }

  const resData = {
    notice: notice,
    files: notice_files.map((file) => file.file),
  };

  return res.status(StatusCodes.OK).json({
    message: "공지사항이 성공적으로 삭제되었습니다.",
    data: resData,
  });
});

exports.updateNotice = asyncWrapper(async (req, res, next) => {
  const { title, content } = req.body;
  const files_deleted = req.body.files_deleted.split(",");
  const notice_id = req.params.notice_id.split("&");
  const academy_id = notice_id[0];
  const lecture_id = parseInt(notice_id[1], 10);
  const notice_num = parseInt(notice_id[2], 10);

  const dirPath = path.join(
    __dirname,
    "../../public/notice",
    academy_id,
    lecture_id.toString(),
    notice_num.toString()
  );

  console.log(`files_deleted: ${files_deleted}`);
  // 삭제할 파일 제거
  if (files_deleted && files_deleted.length > 0) {
    // in file system
    files_deleted.forEach((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    });
    // in database
    await prisma.NoticeFile.deleteMany({
      where: {
        notice_id: req.params.notice_id,
        file: { in: files_deleted },
      },
    });
  }

  // 새 파일 이동
  const new_files = await Promise.all(
    req.files.map(async (file) => {
      const oldPath = file.path;
      const newPath = path.join(dirPath, file.originalname);
      await fs.promises.rename(oldPath, newPath);
      return file.originalname;
    })
  );

  // 새로운 파일 내역 DB에 추가
  const files_to_add = new_files.map((file) => ({
    notice_id: req.params.notice_id,
    file: file,
  }));
  await prisma.NoticeFile.createMany({ data: files_to_add });

  // 공지 텍스트 정보 업데이트
  const notice = await prisma.Notice.update({
    where: { notice_id: req.params.notice_id },
    data: { title, content },
  });

  // 업데이트된 파일 목록 반환
  const updated_files = await prisma.NoticeFile.findMany({
    where: { notice_id: req.params.notice_id },
  });

  return res.status(StatusCodes.OK).json({
    message: "공지사항이 성공적으로 수정되었습니다.",
    data: { notice, files: updated_files.map((file) => file.file) },
  });
});
