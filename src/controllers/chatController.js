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
        member : [req.user.user_id, req.query.opponentId],
        date : new Date()
    });

    return res.status(StatusCodes.OK).json({
        message : "채팅방 생성에 성공하였습니다.",
        chatRoom
    });
})

exports.myChatRoom = asyncWrapper(async(req, res, next) => {
    const chatDB = getChatDB();
    const result = await chatDB.collection("chat_room").find({
        member: { $elemMatch: { $eq: req.user.user_id } } // 배열 내에서 user_id 검색
    }).toArray()

    if (result.length === 0) {
        return next(new CustomError(
            "사용자가 속한 채팅방이 없습니다.",
            StatusCodes.NOT_FOUND,
            StatusCodes.NOT_FOUND
        ));
      }

    return res.status(StatusCodes.OK).json({
        message : "채팅방 목록을 불러오는데 성공하였습니다.",
        result
    });
})

exports.detailChatRoom = asyncWrapper(async(req, res, next) => {
    const chatDB = getChatDB();
      // ObjectId 유효성 검증
  if (!ObjectId.isValid(req.params.id)) {
    return next(new CustomError(
        "잘못된 채팅방 ID입니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
    ))
  }

    const result = await chatDB.collection("chat_room").findOne({
        roomId : req.params.id
    });

    if (!result) {
        return next(new CustomError(
            "해당 채팅방을 찾을 수 없습니다.",
            StatusCodes.NOT_FOUND,
            StatusCodes.NOT_FOUND
        ));
      }

    return res.status(StatusCodes.OK).json({
        message : "채팅방 상세페이지를 불러오는데 성공하였습니다.",
        result
    });
})