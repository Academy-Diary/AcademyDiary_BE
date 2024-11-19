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
            select: { class_id: true, expense: true, discount : true },
        });
        // Class 유효성 검사
        if (classes.length != classId.length) {
            return next(new CustomError(
                "입력한 클래스 ID들이 유효하지 않습니다",
                StatusCodes.BAD_REQUEST,
                StatusCodes.BAD_REQUEST
            ));
        }

        // 입력받은 클래스 비용들 합산 (discount 반영)
        const totalAmount = classes.reduce((sum, currentClass) => {
            const discountedExpense = currentClass.expense - (currentClass.discount || 0);
            return sum + Math.max(0, discountedExpense); // 0 이하의 비용은 0으로 처리
        }, 0);

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
        const userAcademyId = req.user.academy_id;
        const newBills = await Promise.all(
            userId.map((user) => 
                prisma.bill.create({
                    data : {
                        deadline : new Date(deadline),
                        amount : totalAmount,
                        academy : {
                            connect : {
                                academy_id : userAcademyId
                            }
                        },
                        user : {
                            connect : {
                                user_id : user
                            }
                        }
                    }
                })
            )
        );

        // 청구서-Class N:M 테이블에 데이터 저장
        await Promise.all(
            newBills.map((bill) => 
                prisma.billClass.createMany({
                    data : classId.map((x) => ({
                        bill_id : bill.bill_id,
                        class_id : parseInt(x)
                    }))
                })
            )
        )

        return newBills;
    });

    // 성공적인 트랜잭션 후 응답
    return res.status(StatusCodes.OK).json({
        message: "청구서 전송이 완료되었습니다.",
        data: result,
    });
});


exports.getBill = asyncWrapper(async(req, res, next) => {
    const { academy_id } = req.params;
    const isPaid = req.query.isPaid;

    // `isPaid`가 null 또는 undefined일 경우 기본값으로 false를 설정
    if(isPaid === null || isPaid === undefined) {
        isPaid = false;
    }

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

    //academy_id랑 지불여부로 청구서 리스트 찾음
    const foundRawBillList = await prisma.bill.findMany({
        where : {
            academy_id : academy_id,
            paid : isPaid === "true" ? true : false
        },
        include : {
            billClasses : {
                include : { class : { select : { class_name : true } } } 
            },
            user : {
                 select : { user_name : true }
            }
        }
    });

    if (!foundRawBillList || foundRawBillList.length === 0) {
        return next(
          new CustomError(
            "청구서가 존재하지 않습니다.",
            StatusCodes.NOT_FOUND,
            StatusCodes.NOT_FOUND
          )
        );
      }
    
    //데이터 이쁘게 처리 하기! ㅎㅎ
    const responseBillList = foundRawBillList.map((bill) => ({
        bill_id : bill.bill_id,
        deadline : bill.deadline,
        amount : bill.amount,
        paid : bill.paid,
        user_name : bill.user.user_name,
        class_name :  bill.billClasses.map((billClass) => billClass.class.class_name)
    }));

    return res.status(StatusCodes.OK).json({
        message : "청구서 목록을 불러오는데 성공했습니다.",
        responseBillList
    });
})

exports.getMyBill = asyncWrapper(async(req, res, next) => {
    const { user_id } = req.params;

    // JWT에서 user_id를 추출 (인증 미들웨어를 통해 토큰을 디코드하고 req.user에 저장되어있음)
    const userUserId = req.user.user_id;  // JWT 토큰에서 가져온 user_id

    // 파라미터와 로그인한 유저의 소속 academy_id가 일치하는지 확인
    if (userUserId !== user_id) {
        return next(new CustomError(
            "해당 사용자에 대한 접근 권한이 없습니다.",
            StatusCodes.FORBIDDEN,
            StatusCodes.FORBIDDEN
        ));
    }

    const foundBillList = await prisma.bill.findMany({
        where : {
            user_id : user_id
        },
        include : {
            billClasses : {
                include : { class : { select : { class_name : true } } }
            }
        }
    });
    console.log(foundBillList)

    if (!foundBillList || foundBillList.length === 0) {
        return next(
          new CustomError(
            "청구서가 존재하지 않습니다.",
            StatusCodes.NOT_FOUND,
            StatusCodes.NOT_FOUND
          )
        );
      }

    // 청구서 데이터를 가공하여 반환
    const responseBillList = foundBillList.map((billUser) => ({
        bill_id : billUser.bill_id,
        amount: billUser.amount,
        deadline: billUser.deadline,
        paid: billUser.paid,
        class_name: billUser.billClasses.map((billClass) => (
            billClass.class.class_name // class_name 포함
        )),
    }));

    return res.status(StatusCodes.OK).json({
        message : "청구서 목록을 불러오는데 성공했습니다.",
        responseBillList
    });
})

exports.payBill = asyncWrapper(async(req, res, next) => {
    const { academy_id } = req.params;
    const { targetBillList, paid } = req.body

    // `paid` 값이 true 또는 false인지 확인
    if (typeof paid !== 'boolean') {
        return next(new CustomError(
        "paid 값은 true 또는 false만 허용됩니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
        ));
    }

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

    const targetBills = await prisma.bill.findMany({
        where : {
            bill_id : { in : targetBillList }
        }
    });

    // 조회한 청구서가 없을 경우 처리
  if (!targetBills || targetBills.length === 0) {
    return next(new CustomError(
      "유효한 청구서가 없습니다.",
      StatusCodes.NOT_FOUND,
      StatusCodes.NOT_FOUND
    ));
  }

  // 청구서를 paid 상태로 업데이트 (예시)
  await prisma.bill.updateMany({
    where: {
      bill_id: { in: targetBillList }
    },
    data: {
      status: paid
    }
  });

  return res.status(StatusCodes.OK).json({
    message: "청구서가 성공적으로 업데이트 되었습니다.",
    updatedBills: targetBillList
  });
})