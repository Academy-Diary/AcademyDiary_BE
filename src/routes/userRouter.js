const express = require("express");
const prisma = require("../lib/prisma/index");
const router = express.Router();
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { asyncWrapper } = require("../lib/middlewares/async");

/**
 * 회원가입
 */
router.post(
  `/signup`,
  asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;

    // TODO: 비밀번호 암호화 및 에러핸들링 추가
    const createdUser = await prisma.user
      .create({
        data: {
          email,
          password,
        },
      })
      .catch((err) => {
        console.log(err);

        throw new CustomError(
          "Prisma Error accrued!",
          ErrorCode.INTERNAL_SERVER_PRISMA_ERROR,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      });

    res.status(201).json(createdUser);
  })
);

module.exports = router;
