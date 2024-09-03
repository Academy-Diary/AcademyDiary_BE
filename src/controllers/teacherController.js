const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");


exports.deleteTeacher = asyncWrapper(async(req, res, next) => {
    const { user_id } = req.params;

    try {
        const targetTeacher = await prisma.user.findUnique({
            where : { 
                user_id : user_id,
             }
        });

        // 교사가 존재하지 않거나 교사 역할이 아닌 경우
        if (!targetTeacher || targetTeacher.role !== "TEACHER") {
            return next(new CustomError(
                `ID ${user_id}에 해당하는 교사가 없습니다.`,
                StatusCodes.NOT_FOUND,
                StatusCodes.NOT_FOUND
            ));
        }

        const updateTeacher = await prisma.user.update({
            where : {
                user_id : user_id,
            },
            data : {
                academy_id : null
            }
        });

        //AcademyUserRegistrationList도 지워야함!

        // 성공 응답
        res.status(StatusCodes.OK).json({ 
            message: `교사 ID ${user_id}의 academy_id가 성공적으로 NULL로 설정되었습니다.`,
        });
    } catch(error) {
        next(new CustomError(
            "교사 정보 업데이트 중 오류가 발생했습니다.",
            StatusCodes.INTERNAL_SERVER_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
        ));
    }
})

exports.getTeacher = asyncWrapper(async(req, res, next) => {
    const { academy_id } = req.body;

    try{
        const getTeacher = await prisma.AcademyUserRegistrationList.findMany({
            where : {
                academy_id : academy_id,
                role : "TEACHER",
                status : "INACTIVE"
            }
        });

        if(!getTeacher || getTeacher.length === 0) {
            return next(new CustomError(
                "등록되어 있는 강사가 없습니다.",
                StatusCodes.NOT_FOUND,
                StatusCodes.NOT_FOUND
            ));
        }

        // 성공 응답
        res.status(StatusCodes.OK).json({ 
            message: "강사를 성공적으로 불러왔습니다.",
            data: getTeacher
        });
    } catch(error) {
        next(new CustomError(
            "강사 목록을 불러오는 중 오류가 발생했습니다.",
            StatusCodes.INTERNAL_SERVER_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
        ));
    }
})