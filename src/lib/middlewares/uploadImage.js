const multer = require("multer");
const path = require("path");
const { CustomError } = require("../../lib/errors/customError");
const ErrorCode = require("../../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");

// Multer 저장소 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, `../../../public/profile/`)); // 파일 저장 경로
  },
  filename: (req, file, cb) => {
    const newFileName = req.params.user_id + path.extname(file.originalname); // 파일 이름 설정
    cb(null, newFileName);
  },
});

// Multer 파일 필터 및 제한 설정
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new CustomError(
        "허용되지 않는 파일 형식입니다",
        ErrorCode.IMAGE_INCORRECT_FILETYPE,
        StatusCodes.BAD_REQUEST
      )
    
    Error("허용되지 않는 파일 형식입니다");
    error.code = "INCORRECT_FILETYPE";
    return cb(error, false);
  }
  cb(null, true);
};

const uploadImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10000000, // 10MB 제한
  },
});

module.exports = uploadImage;
