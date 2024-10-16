const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { CustomError } = require("../errors/customError");
const ErrorCode = require("../errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const s3 = require("../../config/s3client");
const {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
const { S3_BUCKET_NAME } = require("../../config/secret");
const multerS3 = require("multer-s3");

// Multer 저장소 설정
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, `../../../public/profile/`)); // 파일 저장 경로
  },
  filename: (req, file, cb) => {
    const newFileName = req.params.user_id + path.extname(file.originalname); // 파일 이름 설정
    cb(null, newFileName);
  },
});

const noticeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // destination은 임시로 기본 경로로 설정
    cb(null, path.join(__dirname, "../../../public/notice/tmp"));
  },
  filename: (req, file, cb) => {
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    cb(null, file.originalname);
  },
});

// Multer 파일 필터 및 제한 설정
const imageFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new CustomError(
      "허용되지 않는 파일 형식입니다",
      ErrorCode.IMAGE_INCORRECT_FILETYPE,
      StatusCodes.BAD_REQUEST
    );

    Error("허용되지 않는 파일 형식입니다");
    error.code = "INCORRECT_FILETYPE";
    return cb(error, false);
  }
  cb(null, true);
};

const uploadProfileImage = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10000000, // 10MB 제한
  },
});

const uploadNoticeFile = multer({
  storage: multerS3({
    s3: s3,
    bucket: S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    key: (req, file, cb) => {
      // let academy_id, lecture_id, notice_num;
      try {
        let notice_id;
        if (isNaN(req.params.notice_id)) {
          notice_id = req.body.notice_id.split("&");
        } else {
          notice_id = req.params.notice_id.split("&");
        }
        req.body.academy_id = notice_id[0];
        req.body.lecture_id = parseInt(notice_id[1], 10);
        req.body.notice_num = parseInt(notice_id[2], 10);
      } catch (error) {
        console.log(req);
        throw new CustomError(
          "유효한 값들을 입력해주세요.",
          StatusCodes.BAD_REQUEST,
          StatusCodes.BAD_REQUEST
        );
      } // 경로가 존재하지 않더라도 S3는 자동으로 경로 생성
      file.originalname = Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      );

      const s3KeyPrefix = `public/notice/${req.body.academy_id}/${req.body.lecture_id}/${req.body.notice_num}`;
      const fileKey = `${s3KeyPrefix}/${file.originalname}`;

      cb(null, fileKey);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 파일 크기 제한 10MB
});

// 디렉토리 내의 모든 파일을 S3로 업로드
async function uploadDirToS3(dirPath, bucketName, s3KeyPrefix) {
  const files = await getFiles(dirPath);

  const uploads = files.map((filePath) => {
    const s3Key = `${s3KeyPrefix}/${path
      .relative(dirPath, filePath)
      .replace(/\\/g, "/")}`;
    return s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: fs.createReadStream(filePath),
      })
    );
  });

  await Promise.all(uploads);
}

// 디렉토리 내의 모든 파일을 가져오기 위한 재귀 함수
async function getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

/**
 * S3에서 파일을 삭제하는 함수
 * @param {string} bucketName - S3 버킷 이름
 * @param {string} s3Prefix - 삭제할 파일들의 공통 경로 (폴더)
 * @param {string[]} filesToDelete - 삭제할 파일의 Key 목록 (전체 삭제 시 null 또는 빈 배열)
 */

// S3에서 파일 삭제하는 함수
async function deleteFilesFromS3(bucketName, s3Prefix, filesToDelete = null) {
  try {
    let objectsToDelete = [];

    // 특정 파일 목록이 주어진 경우 해당 파일만 삭제
    if (filesToDelete && filesToDelete.length > 0) {
      objectsToDelete = filesToDelete.map((file) => ({
        Key: `${s3Prefix}${file}`,
      }));
    } else {
      // 특정 파일 목록이 없으면 전체 파일 목록 가져오기
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: s3Prefix,
      });
      const listResponse = await s3.send(listCommand);

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        objectsToDelete = listResponse.Contents.map((item) => ({
          Key: item.Key,
        }));
      }
    }

    if (objectsToDelete.length > 0) {
      // 파일 삭제 요청
      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: objectsToDelete,
        },
      };
      const deleteCommand = new DeleteObjectsCommand(deleteParams);
      await s3.send(deleteCommand);
      console.log(`S3 파일 삭제 성공: ${s3Prefix}`);
    } else {
      console.log(`삭제할 S3 파일이 없습니다: ${s3Prefix}`);
    }
  } catch (error) {
    console.error(`S3 파일 삭제 실패: ${error}`);
    throw new CustomError(
      "S3 디렉토리 삭제 중 오류가 발생했습니다.",
      ErrorCode.S3_DELETE_ERROR,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

module.exports = {
  uploadProfileImage,
  uploadNoticeFile,
  uploadDirToS3,
  deleteFilesFromS3,
};
