const express = require("express");
const http = require("http"); // 기본 http 모듈을 불러옴
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();
const app = express();
const server = http.createServer(app); // Express 앱을 HTTP 서버에 연결
const port = 8000;
const { swaggerUi, specs } = require("./swagger/swagger");
const socketConfig = require("./socket"); // Socket.IO 설정 파일 가져오기
const { MongoClient } = require("mongodb");
const { connectToMongo } = require("../src/lib/chatDB/chatDB");

const whitelist = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8000",
];

const corsOptions = {
  credentials: true, // Allow credentials
  origin: function (origin, callback) {
    console.log("origin", origin);
    if (!origin || whitelist.indexOf(origin) !== -1) {
      // 만일 whitelist 배열에 origin인자가 있을 경우
      callback(null, true); // cors 허용
    } else {
      callback(new Error("Not Allowed Origin!")); // cors 비허용
    }
  },
};

// MongoDB 연결
connectToMongo();

app.use(cors(corsOptions));
app.use(express.json()); // REST API body 파싱
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // request의 cookie 파싱
if (process.env.NODE_ENV === "prod") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// Socket.IO 설정 초기화
socketConfig(server);

// routes
const indexRouter = require("./routes/index");
const userRouter = require("./routes/userRouter");
const registerationRouter = require("./routes/registerationRouter");
const studentRouter = require("./routes/studentRouter");
const teacherRouter = require("./routes/teacherRouter");
const lectureRouter = require("./routes/lectureRouter");
const expenseRouter = require("./routes/expenseRouter");
const examTypeRouter = require("./routes/examTypeRouter");
const noticeRouter = require("./routes/noticeRouter.js");
const billRouter = require("./routes/billRouter");
const chatRouter = require("./routes/chatRouter");

app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/registeration", registerationRouter);
app.use("/student", studentRouter);
app.use("/teacher", teacherRouter);
app.use("/lecture", lectureRouter);
app.use("/expense", expenseRouter);
app.use("/exam-type", examTypeRouter);

//swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))

// error handler
const errorHandler = require("./lib/middlewares/errorHandler");
app.use(errorHandler);

// start server
server.listen(port, () => {
  console.log(`App running on port ${port}...\n>> http://localhost:${port}`);
});

module.exports = app;
