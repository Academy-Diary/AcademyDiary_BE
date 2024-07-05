const { StatusCodes } = require("http-status-codes");
import { CustomError } from "./customError";

class BadRequestError extends CustomError {
  constructor(message) {
    super(message, StatusCodes.BAD_REQUEST); // 400
  }
}

module.exports = BadRequestError;
