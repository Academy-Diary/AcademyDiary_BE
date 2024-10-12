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

    // JWT에서 academy_id를 추출 (인증 미들웨어를 통해 토큰을 디코드하고 req.user에 저장되어있음)
    const userAcademyId = req.user.academy_id;  // JWT 토큰에서 가져온 academy_id

    // 사용자가 다른 학원의 수업을 생성하려고 하는지 체크
    if (userAcademyId !== academy_id) {
        return next(new CustomError(
            "해당 학원에 대한 생성 권한이 없습니다.",
            StatusCodes.FORBIDDEN,
            StatusCodes.FORBIDDEN
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

    return res.status(StatusCodes.OK).json({
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

    // JWT에서 academy_id를 추출 (인증 미들웨어를 통해 토큰을 디코드하고 req.user에 저장되어있음)
    const userAcademyId = req.user.academy_id;  // JWT 토큰에서 가져온 academy_id

    // 사용자가 다른 학원의 수업을 조회하려고 하는지 체크
    if (userAcademyId !== academy_id) {
        return next(new CustomError(
            "해당 학원에 대한 조회 권한이 없습니다.",
            StatusCodes.FORBIDDEN,
            StatusCodes.FORBIDDEN
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

    return res.status(StatusCodes.OK).json({
        message: "성공적으로 Class를 조회했습니다.",
        data : result
    });


})


exports.updateClass = asyncWrapper(async(req, res, next) => {
    const { academy_id, class_id } = req.params;
    const { updateName, updateExpense, updateDiscount, updateDuration } = req.body;

    // JWT에서 academy_id를 추출 (인증 미들웨어를 통해 토큰을 디코드하고 req.user에 저장되어있음)
    const userAcademyId = req.user.academy_id;  // JWT 토큰에서 가져온 academy_id

    // 사용자가 다른 학원의 수업을 수정하려고 하는지 체크
    if (userAcademyId !== academy_id) {
        return next(new CustomError(
            "해당 학원에 대한 수정 권한이 없습니다.",
            StatusCodes.FORBIDDEN,
            StatusCodes.FORBIDDEN
        ));
    }

    const updateData = {};
    
    if (updateName) updateData.class_name = updateName;
    if (updateExpense) updateData.expense = updateExpense;
    if (updateDiscount) updateData.discount = updateDiscount;
    if (updateDuration) updateData.duration = updateDuration;

    const targetClass = await prisma.Class.update({
        where: {
            class_id: Number(class_id),
            academy_id : academy_id
        },
        data: updateData
    });

    return res.status(StatusCodes.OK).json({
        message: "성공적으로 Class를 수정했습니다.",
        data : targetClass
    });
})


exports.deleteClass = asyncWrapper(async(req, res, next) => {
    const { academy_id, class_id } = req.params;

    // JWT에서 academy_id를 추출 (인증 미들웨어를 통해 토큰을 디코드하고 req.user에 저장되어있음)
    const userAcademyId = req.user.academy_id;  // JWT 토큰에서 가져온 academy_id

    // 사용자가 다른 학원의 수업을 삭제하려고 하는지 체크
    if (userAcademyId !== academy_id) {
        return next(new CustomError(
            "해당 학원에 대한 삭제 권한이 없습니다.",
            StatusCodes.FORBIDDEN,
            StatusCodes.FORBIDDEN
        ));
    }

    if (!class_id) {
        return next(new CustomError(
            "class_id를 전달받지 못했습니다.",
            StatusCodes.BAD_REQUEST,
            StatusCodes.BAD_REQUEST
        ));
    }

    
    await prisma.Class.delete({
        where: {
            class_id: Number(class_id), // class_id가 문자열일 경우를 대비하여 숫자로 변환
            academy_id : academy_id
        }
    })
    .then((targetClass) => {
        return res.status(StatusCodes.OK).json({
            message: "성공적으로 Class를 삭제했습니다.",
            data: targetClass
        });
    })
    .catch((error) => {
        // 클래스가 존재하지 않는 경우
        if (error.code === 'P2025') {
            return next(new CustomError(
                "해당 class_id에 대한 클래스를 찾을 수 없습니다.",
                StatusCodes.NOT_FOUND,
                StatusCodes.NOT_FOUND
            ));
        }

        return next(new CustomError(
            "클래스 삭제 중 오류가 발생했습니다.",
            StatusCodes.INTERNAL_SERVER_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
        ));
    });
})