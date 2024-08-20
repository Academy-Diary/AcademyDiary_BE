const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { Status } = require("@prisma/client");

exports.registAcademy = asyncWrapper(async(req, res, next) => {
    const { user_id, academy_id, academy_key, academy_name, academy_email, address, phone_number, status } =
    req.body;

    try {
        const newAcademy = await prisma.academy.create({
            data: {
                user_id,
                academy_id,
                academy_key,
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