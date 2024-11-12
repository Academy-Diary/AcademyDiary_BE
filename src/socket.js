const { getChatDB } = require("./lib/chatDB/chatDB"); // MongoDB 인스턴스 가져오기
const { ObjectId } = require("mongodb");

module.exports = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 방 생성 및 입장
    socket.on("create or join room", async ({ roomId, userId }) => {
        socket.join(roomId);
        console.log(`User ${userId} joined room: ${roomId}`);
  
        // MongoDB에 방 정보 저장 (이미 존재하지 않는다면)
        const chatDB = getChatDB();
        const existingRoom = await chatDB.collection("chat_room").findOne({ _id: new ObjectId(roomId) });
        if (!existingRoom) {
          await chatDB.collection("chat_room").insertOne({
            _id: new ObjectId(roomId),
            member: [userId],
            date: new Date(),
          });
        } else {
          // 이미 존재하면 멤버 목록에 추가
          await chatDB.collection("chat_room").updateOne(
            { _id: new ObjectId(roomId) },
            { $addToSet: { member: userId } } // 중복 없이 추가
          );
        }
  
        io.to(roomId).emit("user joined", { userId });
      });

    // 채팅 메시지 전송
    socket.on("chat message", async ({ roomId, message, userId }) => {
        const chatDB = getChatDB();
        
        // MongoDB에 메시지 저장
        const chatMessage = {
          roomId: new ObjectId(roomId),
          userId,
          message,
          timestamp: new Date(),
        };
        await chatDB.collection("chat_content").insertOne(chatMessage);
  
        // 해당 방에만 메시지 전송
        io.to(roomId).emit("chat message", chatMessage);
      });

    // 채팅방의 모든 메시지 조회
    socket.on("get messages", async ({ roomId }) => {
        const chatDB = getChatDB();
        const messages = await chatDB.collection("chat_content")
          .find({ roomId: new ObjectId(roomId) })
          .sort({ timestamp: 1 })
          .toArray();
  
        socket.emit("all messages", messages); // 해당 사용자에게만 전송
      });

    // 연결 해제 이벤트
    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);
    });
  });
};