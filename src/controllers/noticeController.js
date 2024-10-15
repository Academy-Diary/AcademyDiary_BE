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
const { uploadDirToS3 } = require("../lib/middlewares/uploadFile");
const { throwDeprecation } = require("process");

exports.createNotice = asyncWrapper(async (req, res, next) => {
  const { title, content } = req.body;
  const lecture_id = parseInt(req.body.lecture_id, 10);
  const academy_id = req.user.academy_id;
  const user_id = req.user.user_id;

  if (!title || !content || isNaN(lecture_id)) {
    return next(
      new CustomError("유효한 값들을 입력해주세요.", StatusCodes.BAD_REQUEST)
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
    } catch (error) {
      throw new CustomError(
        "파일 이동 중 오류가 발생했습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
    return file.originalname;
  });

  const notice = await prisma.Notice.create({
    data: {
      title,
      content,
      academy_id,
      lecture_id,
      user_id,
      notice_num: recent_notice_num + 1,
      notice_id: `${academy_id}&${lecture_id}&${recent_notice_num + 1}`,
    },
  });

  await prisma.NoticeFile.createMany({
    data: files.map((file) => ({
      notice_id: notice.notice_id,
      file: file,
    })),
  });

  try {
    const bucketName = S3_BUCKET_NAME;
    const s3KeyPrefix = `public/notice/${academy_id}/${lecture_id}/${
      recent_notice_num + 1
    }`;

    await uploadDirToS3(dirPath, bucketName, s3KeyPrefix);

    // local dirPath 내의 모든 파일 및 dir 삭제
    await Promise.all(
      files.map((file) => unlinkFile(path.join(dirPath, file)))
    );
    
    await fs.promises.rmdir(dirPath);
  } catch (error) {
    console.error("S3 업로드 오류:", error);
    throw new CustomError(
      "S3 업로드 중 오류가 발생했습니다.",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
  return res.status(StatusCodes.CREATED).json({
    message: "공지사항이 성공적으로 생성되었습니다.",
    data: {
      notice,
      files,
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

  if (isNaN(lecture_id) || isNaN(notice_num)) {
    return next(
      new CustomError("유효한 값들을 입력해주세요.", StatusCodes.BAD_REQUEST)
    );
  }

  // NoticeFile 조회
  const notice_files = await prisma.NoticeFile.findMany({
    where: {
      notice_id: req.params.notice_id,
    },
  });

  // NoticeFile 삭제
  await prisma.NoticeFile.deleteMany({
    where: {
      notice_id: req.params.notice_id,
    },
  });
  // Notice 삭제
  const notice = await prisma.Notice.delete({
    where: {
      notice_id: req.params.notice_id,
    },
  });

  // 삭제할 디렉토리 경로 설정
  const dirPath = path.join(
    __dirname,
    "../../public/notice",
    academy_id,
    lecture_id.toString(),
    notice_num.toString()
  );

  // 디렉토리 삭제
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`디렉토리 삭제 성공: ${dirPath}`);
    } else {
      console.log(`삭제할 디렉토리가 존재하지 않습니다: ${dirPath}`);
    }
  } catch (error) {
    console.error(`디렉토리 삭제 실패: ${error}`);
    return next(
      new CustomError(
        "디렉토리 삭제 중 오류가 발생했습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  }

  const resData = {
    notice: notice,
    files: notice_files.map((file) => {
      return file.file;
    }),
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
