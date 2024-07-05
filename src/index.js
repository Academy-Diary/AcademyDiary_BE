const express = require("express");
const app = express();
const port = 5000;

// routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// start server
app.listen(port, () => {
  console.log(`App running on port ${port}...\n>> http://localhost:${port}`);
});
