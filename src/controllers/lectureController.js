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
    });

    if(!LectureList || LectureList.length === 0) {
        return next(new CustomError(
            "현재 개설된 강의가 존재하지 않습니다.",
            StatusCodes.NOT_FOUND,
            StatusCodes.NOT_FOUND
        ))
    }

    res.status(StatusCodes.OK).json({
        message: "강의를 성공적으로 불러왔습니다.",
        data: LectureList
    });
})

//강의 생성
exports.createLecture = asyncWrapper(async(req, res, next) => {
    const { lecture_name, user_id, academy_id } = req.body;

    if(!lecture_name || lecture_name.length === 0 || !user_id || !academy_id) {
        return next(new CustomError(
            "유효하지 않은 입력입니다!",
            StatusCodes.BAD_REQUEST,
            StatusCodes.BAD_REQUEST
        ))
    } 

    const result = await prisma.Lecture.create({
        data: {
            lecture_name,
            teacher_id : user_id,
            academy_id
        }
    });

    res.status(StatusCodes.OK).json({
        message:"새로운 강의가 생성되었습니다!",
        lecture: result
    });
})

//강의 수정
exports.modifyLecture = asyncWrapper(async(req, res, next) => {
    const { lecture_id } = req.params;
    const { lecture_name, teacher_id } = req.body;

    if (!lecture_id || !lecture_name || !teacher_id) {
        return next(new CustomError(
            "유효하지 않은 입력입니다.",
            StatusCodes.BAD_REQUEST,
            StatusCodes.BAD_REQUEST
        ));
    }

    const target_id = parseInt(lecture_id, 10);

    const targetLecture = await prisma.Lecture.findUnique({
        where:{
            lecture_id : target_id
        }
    });

    if(!targetLecture) {
        return next(new CustomError(
            "유효하지 않은 입력입니다.",
            StatusCodes.BAD_REQUEST,
            StatusCodes.BAD_REQUEST
        ));
    }
    
    const result = await prisma.Lecture.update({
        where:{
            lecture_id : target_id
        },
        data:{
            lecture_name : lecture_name,
            teacher_id : teacher_id
        }
    });

    res.status(StatusCodes.OK).json({
        message: "수정이 성공적으로 완료되었습니다.",
        data: result
    });
})

//강의 삭제
exports.deleteLecture = asyncWrapper(async(req, res, next) => {
    let { lecture_id } = req.params;

    // lecture_id가 존재하지 않으면 에러 처리
    if (!lecture_id) {
        return next(new CustomError(
            "유효한 lecture_id가 제공되지 않았습니다.",
            StatusCodes.BAD_REQUEST,
            StatusCodes.BAD_REQUEST
        ));
    }
    const target_id = parseInt(lecture_id, 10);

    const targetLecture = await prisma.Lecture.findUnique({
        where:{
            lecture_id : target_id
        }
    });

    if(!targetLecture) {
        return next(new CustomError(
            "유효하지 않은 입력입니다.",
            StatusCodes.BAD_REQUEST,
            StatusCodes.BAD_REQUEST
        ));
    }

    await prisma.Lecture.delete({
        where:{
            lecture_id : target_id
        }
    });

    res.status(StatusCodes.OK).json({
        message: "삭제가 성공적으로 완료되었습니다.",
        lecture_id: target_id
    });
})