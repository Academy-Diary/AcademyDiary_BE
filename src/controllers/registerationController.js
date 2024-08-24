const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { Status } = require("@prisma/client");
const crypto = require("crypto");

function generateInviteKey() {
  return crypto.randomBytes(16).toString("hex");
}

exports.registAcademy = asyncWrapper(async(req, res, next) => {
    const { user_id, academy_id, academy_key, academy_name, academy_email, address, phone_number, status } =
    req.body;

    const inviteKey = generateInviteKey();
    try {
        const newAcademy = await prisma.academy.create({
            data: {
                user_id,
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
            res.status(StatusCodes.DUPLICATE_ENTRY).json({
                message: '이미 존재하는 학원 ID나 이메일입니다.'
            })
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: '학원 등록 중 오류가 발생했습니다.'
            })
        }
    }
})

exports.registUser = asyncWrapper(async(req, res, next) =>{
    const { user_id, academy_key, role } = req.body;

    try {
        //입력받은 academy_key로 academy찾기
        const searchAcademy = await prisma.academy.findUnique({
            where : { academy_key }
        })
        if(!searchAcademy){
            return res.status(StatusCodes.NOT_FOUND).json({
                message: '학원을 찾을 수 없습니다.'
            });
        }

        //학원 유저 신청 목록DB에 user_id가 이미 있는지 검사
        const checkUser = await prisma.AcademyUserRegistrationList.findUnique({
            where : { user_id }
        })
        if (checkUser) {
            return res.status(StatusCodes.CONFLICT).json({
                message: '이미 등록요청된 유저입니다.'
            });
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
        if (error.code === 'P2002') { // Prisma의 unique constraint 오류 코드
            res.status(StatusCodes.DUPLICATE_ENTRY).json({
                message: '이미 등록요청된 유저입니다.'
            })
        }
    }


})