const { StatusCodes } = require("http-status-codes");

const ErrorHandlerMiddleware = (err, req, res, next) => {
  const error = {
    // 에러가 발생했지만, 기본적인 에러 코드나 에러 메세지가 존재하지 않을 경우를 대비한 default 에러 코드 및 에러 메세지
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, // 500
    errorCode: err.errorCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Internal server error",
  };

  // console.log("eeeeeeeeeeeeeeeee", error);
  return res
    .status(error.statusCode)
    .json({ message: error.message, errorCode: error.errorCode });
};

module.exports = ErrorHandlerMiddleware;
