const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");

//학원내의 모든 강의 조회
exports.getLecture = asyncWrapper(async(req, res, next) => {
    const { academy_id } = req.body;

    if (!academy_id) {
        return next(new CustomError(
            "유효한 academy_id가 제공되지 않았습니다.",
            StatusCodes.BAD_REQUEST,
            StatusCodes.BAD_REQUEST
        ));
    }

    const LectureList = await prisma.Lecture.findMany({
        where : {
            academy_id: academy_id
        }
    })

    if(!targetLecture || targetLecture.length === 0) {
        return next(new CustomError(
            "현재 개설된 강의가 존재하지 않습니다.",
            StatusCodes.NOT_FOUND,
            StatusCodes.NOT_Fou
        ))
    }
    res.status(StatusCodes.OK).json({
        message: "강의를 성공적으로 불러왔습니다.",
        data: LectureList
    })
})