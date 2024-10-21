const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { getChatDB } = require("../lib/chatDB/chatDB");
const { ObjectId } = require("mongodb"); // MongoDB ObjectId 가져오기


exports.createRoom = asyncWrapper(async(req, res, next) => {
    const chatDB = getChatDB();
    const chatRoom = await chatDB.collection("chat_room").insertOne({
        member : [req.user.user_id, new ObjectId(req.query.opponentId)],
        date : new Date()
    });

    return res.status(StatusCodes.OK).json({
        message : "채팅방 생성에 성공하였습니다.",
        chatRoom
    });
})

