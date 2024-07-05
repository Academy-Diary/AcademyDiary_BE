const express = require("express");
const app = express();
const port = 5000;
const indexRouter = require("./routes/index");

// routes
app.use("/", indexRouter);

// start server
app.listen(port, () => {
  console.log(`App running on port ${port}...\n>> http://localhost:${port}`);
});
