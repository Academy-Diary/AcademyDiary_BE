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

    // 방 나가기 처리
    socket.on("leave room", ({ roomId, userId }) => {
      socket.leave(roomId);
      console.log(`User ${userId} left room: ${roomId}`);
    });

    // 방 생성 및 입장
    socket.on("create or join room", async ({ roomId, userId }) => {
      const chatDB = getChatDB();
      const existingRoom = await chatDB.collection("chat_room").findOne({ _id: roomId });
      
      if (existingRoom) {
        // 이미 방이 존재하면 사용자 확인 후, 중복 없이 멤버 추가
        if (!existingRoom.member.includes(userId)) {
          await chatDB.collection("chat_room").updateOne(
            { _id: roomId },
            { $addToSet: { member: userId } } // 중복 없이 추가
          );
        }
      } else {
        // 방이 존재하지 않으면 새로운 방 생성
        await chatDB.collection("chat_room").insertOne({
          _id: roomId,
          member: [userId],
          date: new Date(),
        });
      }
      
      // 방에 사용자 추가
      socket.join(roomId);
      console.log(`User ${userId} joined room: ${roomId}`);

      io.to(roomId).emit("user joined", { userId });
    });

    // 채팅 메시지 전송
    socket.on("chat message", async ({ roomId, message, userId }) => {
      const chatDB = getChatDB();
      
      // MongoDB에 메시지 저장
      const chatMessage = {
        roomId: roomId,
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
        .find({ roomId: roomId })
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