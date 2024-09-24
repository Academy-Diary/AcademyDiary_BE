const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");


exports.deleteTeacher = asyncWrapper(async(req, res, next) => {
    const { id } = req.params;

    try {
        //user_id가 올바르게 전달되었는지 확인
        if (!id) {
            return next(new CustomError(
                "유효한 user_id가 제공되지 않았습니다.",
                StatusCodes.BAD_REQUEST,
                StatusCodes.BAD_REQUEST
            ));
        }
        //강사 정보 조회
        const targetTeacher = await prisma.user.findUnique({
            where : { 
                user_id : id,
             }
        });

        // 강사가 존재하지 않거나 강사 역할이 아닌 경우
        if (!targetTeacher || targetTeacher.role !== "TEACHER") {
            return next(new CustomError(
                `ID ${id}에 해당하는 강사가 없습니다.`,
                StatusCodes.NOT_FOUND,
                StatusCodes.NOT_FOUND
            ));
        }

        //강사의 academy_id를 NULL로 업데이트
        await prisma.user.update({
            where : {
                user_id : id,
            },
            data : {
                academy_id : null
            }
        });

        //AcademyUserRegistrationList에서 해당 강사 행 삭제
        await prisma.AcademyUserRegistrationList.delete({
            where:{
                user_id: id
            }
        });

        // 성공 응답
        res.status(StatusCodes.OK).json({ 
            message: `강사 ID ${id}의 academy_id가 성공적으로 NULL로 설정되었고, 등록 목록에서 삭제되었습니다.`,
        });
    } catch(error) {
        next(new CustomError(
            "강사 정보 업데이트 중 오류가 발생했습니다.",
            StatusCodes.INTERNAL_SERVER_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
        ));
    }
})

exports.getTeacher = asyncWrapper(async(req, res, next) => {
    const { academy_id } = req.params;

    // JWT에서 academy_id를 추출 (인증 미들웨어를 통해 토큰을 디코드하고 req.user에 저장되어있음)
    const userAcademyId = req.user.academy_id;  // JWT 토큰에서 가져온 academy_id

    // 파라미터와 로그인한 유저의 소속 academy_id가 일치하는지 확인
    if (userAcademyId !== academy_id) {
        return next(new CustomError(
            "해당 학원에 대한 접근 권한이 없습니다.",
            StatusCodes.FORBIDDEN,
            StatusCodes.FORBIDDEN
        ));
    }

    try{
        const getTeacher = await prisma.AcademyUserRegistrationList.findMany({
            where : {
                academy_id : academy_id,
                role : "TEACHER",
                status : "APPROVED"
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