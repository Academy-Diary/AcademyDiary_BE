const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { Status } = require("@prisma/client");
const crypto = require("crypto");
const { error } = require("console");

function generateInviteKey() {
  return crypto.randomBytes(16).toString("hex");
}

exports.registerAcademy = asyncWrapper(async(req, res, next) => {
    const { user_id, academy_id, academy_key, academy_name, academy_email, address, phone_number, status } =
    req.body;

    const inviteKey = generateInviteKey();
    try {
        const newAcademy = await prisma.academy.create({
            data: {
                academy_id,
                academy_key : inviteKey,
                academy_name,
                academy_email,
                address,
                phone_number,
                status: 'INITIAL' // 학원의 상태를 'INITIAL'로 설정합니다.
            }
        });

        res.status(StatusCodes.CREATED).json({
            message: '학원 등록이 성공적으로 완료되었습니다.',
            data: newAcademy
        });
    } catch (error) {
        if (error.code === 'P2002') { // Prisma의 unique constraint 오류 코드
            throw new CustomError(
                "이미 존재하는 학원 ID나 이메일입니다.",
                StatusCodes.DUPLICATE_ENTRY,
                StatusCodes.DUPLICATE_ENTRY
            );
        } else {
            throw new CustomError(
                "학원 등록 중 오류가 발생했습니다.",
                StatusCodes.INTERNAL_SERVER_ERROR,
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
})

exports.registerUser = asyncWrapper(async(req, res, next) =>{
    const { user_id, academy_key, role } = req.body;

    try {
        //입력받은 academy_key로 academy찾기
        const searchAcademy = await prisma.academy.findUniqueOrThrow({
            where : { academy_key }
        }).catch((error) => {
            if (error.code === "P2018" || error.code === "P2025") {
                // prisma not found error code
                throw new CustomError(
                  "학원을 찾을 수 없습니다.",
                  StatusCodes.NOT_FOUND,
                  StatusCodes.NOT_FOUND
                );
              } else {
                throw new CustomError(
                  "Prisma Error occurred!",
                  ErrorCode.INTERNAL_SERVER_PRISMA_ERROR,
                  StatusCodes.INTERNAL_SERVER_ERROR
                );
              }
        })

        //학원 유저 신청 목록DB에 user_id가 이미 있는지 검사
        const checkUser = await prisma.AcademyUserRegistrationList.findUnique({
            where : { user_id }
        })
        if (checkUser) {
            throw new CustomError(
                "이미 등록요청된 유저입니다.",
                StatusCodes.CONFLICT,
                StatusCodes.CONFLICT
            );
        }
        //없다면 DB에 req.body내용 추가
        const newUser = await prisma.AcademyUserRegistrationList.create({
            data: {
                user_id,
                academy_id : searchAcademy.academy_id,
                role,
                status: 'INITIAL'
            }
        });

        res.status(StatusCodes.CREATED).json({
            message: '등록요청이 성공적으로 완료되었습니다.',
            data: newUser
        })
    
    } catch(error) {
        throw new CustomError(
            "사용자 등록 요청 중 오류가 발생했습니다.",
            StatusCodes.INTERNAL_SERVER_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
        );
    }
})

exports.decideUserStatus = asyncWrapper(async(req, res, next) =>{
    const { academy_id, user_id, agreed} = req.body;
    
    const searchUser = await prisma.AcademyUserRegistrationList.findUniqueOrThrow({
        where : { 
            academy_id : academy_id,
            user_id : user_id
        }
    }).catch((error) => {
        if (error.code === "P2018" || error.code === "P2025") {
            // prisma not found error code
            throw new CustomError(
              "해당하는 유저가 존재하지 않습니다.",
              StatusCodes.NOT_FOUND,
              StatusCodes.NOT_FOUND
            );
          } else {
            throw new CustomError(
              "Prisma Error occurred!",
              ErrorCode.INTERNAL_SERVER_PRISMA_ERROR,
              StatusCodes.INTERNAL_SERVER_ERROR
            );
          }
    })

    // agreed 값에 따라 상태를 결정
    const newStatus = agreed ? 'ACTIVE' : 'INACTIVE';

    //유저의 STATUS 업데이트
    const updatedUser = await prisma.AcademyUserRegistrationList.update({
        where : { 
            academy_id : academy_id,
            user_id : user_id
        },
        data: { status : newStatus},
        });

    res.status(StatusCodes.ACCEPTED).json({
        message: '유저승인/거절이 성공적으로 완료되었습니다.',
        data: updatedUser
    })
})

exports.listUser = asyncWrapper(async (req, res, next) => {
    const { req_role, academy_id } = req.body;

    try {
        let result;

        if (req_role === "TEACHER") {
            result = await prisma.AcademyUserRegistrationList.findMany({
                where: {
                    academy_id : academy_id,
                    role: "TEACHER",
                    status: "INITIAL"
                }
            });
        } else if (req_role === "STUDENT") {
            result = await prisma.AcademyUserRegistrationList.findMany({
                where: {
                    academy_id : academy_id,
                    role: "STUDENT",
                    status: "INITIAL"
                }
            });
        } else {
            return next(new CustomError(
                "유효하지 않은 역할입니다.",
                StatusCodes.BAD_REQUEST,
                StatusCodes.BAD_REQUEST
            ));
        }

        if (!result || result.length === 0) {
            return next(new CustomError(
                "해당 조건에 맞는 사용자가 없습니다.",
                StatusCodes.NOT_FOUND,
                StatusCodes.NOT_FOUND
            ));
        }

        res.status(StatusCodes.OK).json({ data: result });

    } catch (error) {
        next(new CustomError(
            "불러오는 중에 오류가 발생했습니다.",
            StatusCodes.INTERNAL_SERVER_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
        ));
    }
})

exports.listAcademy = asyncWrapper(async(req, res, next) => {
    try {
        const result = await prisma.Academy.findMany({
            where : {
                status: "INITIAL"
            }
        })

        if (!result || result.length === 0) {
            return next(new CustomError(
                "해당 조건에 맞는 사용자가 없습니다.",
                StatusCodes.NOT_FOUND,
                StatusCodes.NOT_FOUND
            ));
        }

        res.status(StatusCodes.OK).json({ data: result });

    } catch(error) {
        next(new CustomError(
            "아카데미 목록을 불러오는 중에 오류가 발생했습니다.",
            StatusCodes.INTERNAL_SERVER_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
        ));
    }
})