const multer = require("multer");
const path = require("path");
const { CustomError } = require("../errors/customError");
const ErrorCode = require("../errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("./async");

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
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
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

module.exports = { uploadProfileImage, uploadNoticeFile };
