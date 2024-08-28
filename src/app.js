const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require('dotenv').config();
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
const registerationRouter = require("./routes/registerationRouter");
app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/registeration", registerationRouter);

// error handler
const errorHandler = require("./lib/middlewares/errorHandler");
app.use(errorHandler);

// start server
app.listen(port, () => {
  console.log(`App running on port ${port}...\n>> http://localhost:${port}`);
});

module.exports = app;
