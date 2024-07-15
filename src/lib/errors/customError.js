class CustomError extends Error {
  statusCode;
  errorCode;

  constructor(message, errorCode, statusCode) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }
}

module.exports = { CustomError };
