const { getChatDB } = require("./lib/chatDB/chatDB"); // MongoDB 인스턴스 가져오기

module.exports = (server) => {
  const io = require("socket.io")(server);

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // 채팅 메시지 전송 이벤트 처리
    socket.on("chat message", async (msg) => {
      console.log("message:", msg);
      
      // MongoDB에 메시지 저장
      const chatDB = getChatDB();
      await chatDB.collection("chat_content").insertOne({
        userId: socket.id,
        message: msg,
        timestamp: new Date(),
      });

      // 모든 클라이언트에게 메시지 전송
      io.emit("chat message", msg);
    });

    // 연결 해제 이벤트
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};