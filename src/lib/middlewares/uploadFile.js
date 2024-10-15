const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { CustomError } = require("../errors/customError");
const ErrorCode = require("../errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("./async");
const s3 = require("../../config/s3client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

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
  storage: noticeStorage,
  limits: {
    fileSize: 10000000, // 10MB 제한
  },
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
module.exports = { uploadProfileImage, uploadNoticeFile, uploadDirToS3 };
