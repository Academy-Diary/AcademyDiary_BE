const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { Status } = require("@prisma/client");


exports.createBill = asyncWrapper(async(req, res, next) => {
    //userId와 classId는 배열로 받는다.
    const userId = req.body.user_id;
    const classId = req.body.class_id;
    const deadline = req.body.deadline;

    // const userId = paramsUser.split(','); // user_id 쿼리스트링을 배열로 변환
    // const classId = paramsClass.split(','); // class_id 쿼리스트링을 배열로 변환

    const classes = await prisma.class.findMany({
        where : {
            class_id : {in : classId}
        },
        select : { expense : true }
    });
    console.log(classes);

    //입력받은 클래스 비용들 합산
    const totalAmount = classes.reduce((sum, currentClass) => sum + currentClass.expense, 0);

    const newBill = await prisma.bill.create({
        data : {
            deadline : deadline,
            amount : totalAmount // 클래스 비용을 합산하여 저장
        }
    });
    
    await prisma.billClass.createMany({
         data : classId.map((x) => {
            return {
                bill_id : newBill.bill_id, 
                class_id : parseInt(x)
            };
        })
    });

    await prisma.billUser.createMany({
        data : userId.map((x) => {
           return {
               bill_id : newBill.bill_id, 
               user_id : x
           };
       })
   });

   return res.status(StatusCodes.OK).json({
        message : "청구서 전송이 완료되었습니다.",
        data : newBill
   })

})