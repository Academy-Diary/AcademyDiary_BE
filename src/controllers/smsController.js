const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { Service } = require("../lib/sms/Service");
const { getAuthDB } = require("../lib/mongo/mongo");



exports.postOtp = asyncWrapper(async (req, res, next) => {
    const { phoneNumber } = req.body;
  
    // OTP 생성
    const randomOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
    const otp = randomOtp();
  
    const otpData = {
      phoneNumber: phoneNumber,
      otp: otp,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3분 후 만료
    };
  
    try {
      const smsDB = getAuthDB();
      const collection = smsDB.collection("mms");
  
      // TTL 인덱스 설정
      await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  
      // MongoDB에 OTP 데이터 삽입
      await collection.insertOne(otpData);
  
      return res.status(StatusCodes.OK).json({
        message: "OTP가 성공적으로 생성되고 전송되었습니다.",
      });
    } catch (error) {
      return next(new CustomError(
        "OTP 생성 또는 전송 중 오류가 발생했습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      ));
    }
  });