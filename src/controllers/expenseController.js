const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");

exports.createClass = asyncWrapper(async(req, res, next)=>{
    const { academy_id } = req.params;
    const { class_name, expense, discount, duration } = req.body;

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

    // 3. 중복된 클래스 이름이 같은 학원에 이미 존재하는지 확인
    const existingClass = await prisma.Class.findFirst({
        where: {
            class_name: class_name,
            academy_id: academy_id
        }
    });

    if (existingClass) {
        return next(new CustomError(
            "해당 학원에 동일한 이름의 Class가 이미 존재합니다.",
            StatusCodes.CONFLICT,
            StatusCodes.CONFLICT
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

    if(!result || result.length === 0){
        return next(new CustomError(
            "Class를 생성하는데 실패하였습니다.",
            StatusCodes.INTERNAL_SERVER_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
        ));
    }

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


exports.updateClass = asyncWrapper(async(req, res, next) => {
    const { academy_id } = req.params;
    const { class_id, updateName, updateExpense, updateDiscount, updateDuration } = req.body;

    const updateData = {};
    
    if (updateName) updateData.class_name = updateName;
    if (updateExpense) updateData.expense = updateExpense;
    if (updateDiscount) updateData.discount = updateDiscount;
    if (updateDuration) updateData.duration = updateDuration;

    const targetClass = await prisma.Class.update({
        where: {
            class_id: class_id
        },
        data: updateData
    });

    res.status(StatusCodes.OK).json({
        message: "성공적으로 Class를 수정했습니다.",
        data : targetClass
    });
})
