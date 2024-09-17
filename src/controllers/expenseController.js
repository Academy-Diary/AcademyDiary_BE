const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");

exports.createClass = asyncWrapper(async(req, res, next)=>{
    const { class_name, academy_id, expense, discount, duration } = req.body;

    // 1. 입력값 검증
    if (!class_name || !academy_id || expense === undefined || duration === undefined) {
        return next(new CustomError(
            "필수 필드가 누락되었습니다.", 
            StatusCodes.BAD_REQUEST,
            StatusCodes.BAD_REQUEST
        ));
    }

    // 2. academy_id가 실제 존재하는지 확인
    const academy = await prisma.Academy.findUnique({
        where: { academy_id: academy_id }
    });

    if (!academy) {
        return next(new CustomError(
            "존재하지 않는 Academy ID입니다.",
             StatusCodes.NOT_FOUND,
             StatusCodes.NOT_FOUND
            ));
    }

    const result = await prisma.Class.create({
        data: {
            class_name,
            academy_id,
            expense,
            discount,
            duration
        }
    });

    res.status(StatusCodes.OK).json({
        message: "성공적으로 Class를 생성했습니다.",
        data : result
    });


})

exports.getClass = asyncWrapper(async(req, res, next) => {
    const { academy_id } = req.params

    // 1. 입력값 검증
    if (!academy_id) {
        return next(new CustomError(
            "유효한 academy_id가 제공되지 않았습니다.", 
            StatusCodes.BAD_REQUEST,
            StatusCodes.BAD_REQUEST
        ));
    }

    const result = await prisma.Class.findMany({
        where: {
            academy_id : academy_id
        }
    })

    if(!result || result.length === 0){
        return next(new CustomError(
            "Class가 존재하지않아 불러올 수 없습니다.",
            StatusCodes.NOT_FOUND,
            StatusCodes.NOT_FOUND
        ));
    }

    res.status(StatusCodes.OK).json({
        message: "성공적으로 Class를 조회했습니다.",
        data : result
    });


})