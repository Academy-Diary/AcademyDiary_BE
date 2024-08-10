const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')

const app = express();
const port = 8000;

app.use(cors()); //cross-origin
app.use(express.json()); // REST API body 파싱
app.use(cookieParser()); // request의 cookie 파싱
if (process.env.NODE_ENV === "prod") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// routes
const indexRouter = require("./routes/index");
const userRouter = require("./routes/userRouter");
app.use("/", indexRouter);
app.use("/user", userRouter);

// error handler
const errorHandler = require("./lib/middlewares/errorHandler");
app.use(errorHandler);

// start server
app.listen(port, () => {
  console.log(`App running on port ${port}...\n>> http://localhost:${port}`);
});

//passport라이브러리 세팅
app.use(session({
  secret: '암호화에 쓸 비번', //env파일로 뺄것
  resave : false, //유저가 요청날릴 때 마다 session데이터를 다시 갱신할건지 여부
  saveUninitialized : false
}))
app.use(passport.initialize())
app.use(passport.session())

module.exports = app;
