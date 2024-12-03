const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { updateHeadcount } = require("../lib/prisma/headcount");

exports.deleteTeacher = asyncWrapper(async(req, res, next) => {
    const arr_user_id = req.body.user_id;

    //user_id가 올바르게 전달되었는지 확인
    if (!arr_user_id) {
      return next(
        new CustomError(
          "유효한 user_id가 제공되지 않았습니다.",
          StatusCodes.BAD_REQUEST,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    try{
      const result = await prisma.$transaction(async (prisma) => {
        // 1. 강사 및 관련 데이터 삭제
        // 강사의 academy_id를 NULL로 업데이트
        await prisma.user.updateMany({
          where: {
            user_id: {
              in: arr_user_id,
            },
          },
          data: {
            academy_id: null,
          },
        });
        
        // AcademyUserRegistrationList에서 해당 강사 행 삭제
        await prisma.AcademyUserRegistrationList.deleteMany({
          where: {
            user_id: {
              in: arr_user_id,
            },
          },
        });
        // Headcount 업데이트
        return await updateHeadcount(prisma, req.user.academy_id)
      });

      return res.status(StatusCodes.OK).json({
        message: "강사 삭제가 성공적으로 완료되었습니다.",
        data:{
          deletedUserIds: arr_user_id,
          deletedCount: arr_user_id.length, // 입력과 실제 삭제되는 유저 수가 같음
          remainedCount: result.teacher_headcount // 삭제 후 남은 강사 수
        }
      });
    }catch(error) {
      return next(new CustomError(
        "강사 삭제 중 오류가 발생했습니다.",
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
            },
            include : {
                user : {
                    select : {
                        user_id : true,
                        user_name : true,
                        email : true,
                        phone_number : true,
                        lectures : {
                            select : {
                                lecture_id : true,
                                lecture_name : true
                            }
                        }
                    }
                }
            }
        });

        if(!getTeacher || getTeacher.length === 0) {
            return next(new CustomError(
                "등록되어 있는 강사가 없습니다.",
                StatusCodes.NOT_FOUND,
                StatusCodes.NOT_FOUND
            ));
        }

        // academy_id와 user_id를 제외한 필드만 반환
        const formattedTeachers = getTeacher.map(teacher => {
            const { academy_id, ...rest } = teacher.user;  // academy_id와 user_id 제외
            return {
                ...rest, // 나머지 필드 반환
                lectures: teacher.user.lectures  // lectures 정보 추가
            };
        });

        // 성공 응답
        return res.status(StatusCodes.OK).json({ 
            message: "강사를 성공적으로 불러왔습니다.",
            data: {
                academy_id: academy_id,
                role: "TEACHER",
                status: "APPROVED",
                user : formattedTeachers
            }
        });
    } catch(error) {
        return next(new CustomError(
            "강사 목록을 불러오는 중 오류가 발생했습니다.",
            StatusCodes.INTERNAL_SERVER_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
        ));
    }
})