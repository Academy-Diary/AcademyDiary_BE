const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const app = express();
const port = 5000;

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
