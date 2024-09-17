const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const expenseController = require("../controllers/expenseController.js");


router.post("/expense", authenticateJWT, expenseController.createClass);


module.exports = router;