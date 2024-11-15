const { MongoClient } = require("mongodb");
const { chatDBurl } = require("../../config/secret");

let chatDB;

const connectToMongo = async () => {
  try {
    const client = await new MongoClient(chatDBurl).connect();
    console.log("채팅DB 연결 성공");
    chatDB = client.db("chat");
  } catch (err) {
    console.error("MongoDB 연결 실패", err);
  }
};

const getChatDB = () => {
  if (!chatDB) {
    throw new Error("MongoDB에 연결되지 않았습니다. 먼저 connectToMongo를 호출하세요.");
  }
  return chatDB;
};

module.exports = { connectToMongo, getChatDB };