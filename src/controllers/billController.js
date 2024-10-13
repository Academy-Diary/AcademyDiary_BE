const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { Status } = require("@prisma/client");


exports.createBill = asyncWrapper(async (req, res, next) => {
    // userId와 classId는 배열로 받는다.
    const userId = req.body.user_id;
    const classId = req.body.class_id;
    const deadline = req.body.deadline;


    // 트랜잭션 사용 => 여러 데이터베이스 작업이 모두 성공했을 때만 커밋되도록 트랜잭션을 사용 =>  하나의 작업이 실패할 경우 모든 변경 사항을 롤백
    const result = await prisma.$transaction(async (prisma) => {
        // 입력받은 class들을 DB에서 꺼내온다.
        const classes = await prisma.class.findMany({
            where: {
                class_id: { in: classId.map((id) => parseInt(id)) },
            },
            select: { class_id: true, expense: true },
        });
        // Class 유효성 검사
        if (classes.length != classId.length) {
            return next(new CustomError(
                "입력한 클래스 ID들이 유효하지 않습니다",
                StatusCodes.BAD_REQUEST,
                StatusCodes.BAD_REQUEST
            ));
        }

        // 입력받은 클래스 비용들 합산
        const totalAmount = classes.reduce((sum, currentClass) => sum + currentClass.expense, 0);

        // 유저 유효성 검사
        const users = await prisma.user.findMany({
            where: {
                user_id: { in: userId },
            },
            select: { user_id: true },
        });

        if (users.length !== userId.length) {
            return next(new CustomError(
                "입력한 유저 ID들이 유효하지 않습니다",
                StatusCodes.BAD_REQUEST,
                StatusCodes.BAD_REQUEST
            ));
        }

        // 새 청구서 생성
        const newBill = await prisma.bill.create({
            data: {
                deadline: new Date(deadline),
                amount: totalAmount, // 클래스 비용을 합산하여 청구서에 저장
            },
        });

        // 청구서-Class N:M 테이블에 데이터 저장
        await prisma.billClass.createMany({
            data : classId.map((x) => {
               return {
                   bill_id : newBill.bill_id, 
                   class_id : parseInt(x)
               };
           })
       });

        // 청구서-User N:M 테이블에 데이터 저장
        await prisma.billUser.createMany({
            data : userId.map((x) => {
               return {
                   bill_id : newBill.bill_id, 
                   user_id : x
               };
           })
       });

        return newBill;
    });

    // 성공적인 트랜잭션 후 응답
    return res.status(StatusCodes.OK).json({
        message: "청구서 전송이 완료되었습니다.",
        data: result,
    });
});