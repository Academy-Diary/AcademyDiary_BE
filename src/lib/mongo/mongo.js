const { MongoClient } = require("mongodb");
const { MONGO_DB_URL } = require("../../config/secret");

let client, chatDB, quizDB, authDB;

const connectToMongo = async () => {
  try {
    client = await new MongoClient(MONGO_DB_URL).connect();
    console.log("MongoDB 연결 성공");
    chatDB = client.db("chat");
    quizDB = client.db("Quiz");
    authDB = client.db("auth");
  } catch (err) {
    console.error("MongoDB 연결 실패", err);
  }
};

const getChatDB = () => {
  if (!chatDB) {
    throw new Error(
      "MongoDB에 연결되지 않았습니다. 먼저 connectToMongo를 호출하세요."
    );
  }
  return chatDB;
};

const getQuizDB = () => {
  if (!quizDB) {
    throw new Error(
      "MongoDB에 연결되지 않았습니다. 먼저 connectToMongo를 호출하세요."
    );
  }
  return quizDB;
};

const getAuthDB = () => {
  if (!authDB) {
    throw new Error(
      "MongoDB에 연결되지 않았습니다. 먼저 connectToMongo를 호출하세요."
    );
  }
  return authDB;
};

// MongoClient를 반환하는 함수 추가
const getMongoClient = () => {
  if (!client) {
    throw new Error(
      "MongoClient가 초기화되지 않았습니다. 먼저 connectToMongo를 호출하세요."
    );
  }
  return client;
};

module.exports = { connectToMongo, getChatDB, getQuizDB, getAuthDB, getMongoClient };
