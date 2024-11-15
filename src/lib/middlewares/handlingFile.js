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

const profileStorage = multerS3({
  s3: s3,
  bucket: S3_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  acl: "public-read",
  key: (req, file, cb) => {
    // 한글 인코딩 문제 해결
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    const s3KeyPrefix = `public/profile`;
    // 저장 경로 설정 - public/profile/user_id.jpg(파일 확장자)
    // 경로가 존재하지 않더라도 S3는 자동으로 경로 생성
    const fileKey = `${s3KeyPrefix}/${req.params.user_id}${path.extname(file.originalname)}`;

    cb(null, fileKey);
  },
});

// Multer image 파일 필터 및 제한 설정
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 파일 크기 제한 10MB
});

const uploadNoticeFile = multer({
  storage: multerS3({
    s3: s3,
    bucket: S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    key: (req, file, cb) => {
      console.log(req.params.notice_id);
      let notice_id;
      if (!req.params.notice_id) {
        console.log("params 없음");
        notice_id = req.body.notice_id.split("&");
      } else {
        console.log(req.params);
        notice_id = req.params.notice_id.split("&");
      }
      const academy_id = notice_id[0];
      const lecture_id = parseInt(notice_id[1], 10);
      const notice_num = parseInt(notice_id[2], 10);

      // 경로가 존재하지 않더라도 S3는 자동으로 경로 생성
      file.originalname = Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      );

      const s3KeyPrefix = `public/notice/${academy_id}/${lecture_id}/${notice_num}`;
      const fileKey = `${s3KeyPrefix}/${file.originalname}`;

      cb(null, fileKey);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 파일 크기 제한 10MB
});

/**
 * S3에서 파일을 삭제하는 함수
 * @param {string} bucketName - S3 버킷 이름
 * @param {string} s3Prefix - 삭제할 파일들의 공통 경로 (폴더)
 * @param {string[]} filesToDelete - 삭제할 파일의 Key 목록 (전체 삭제 시 null 또는 빈 배열)
 */
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
      console.log(`S3 파일 삭제 성공: ${objectsToDelete}`);
    } else {
      console.log(`삭제할 S3 파일이 없습니다: ${objectsToDelete}`);
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
  deleteFilesFromS3,
};
