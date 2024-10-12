const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const billController = require("../controllers/billController.js");



router.post("/", billController.createBill);


module.exports = router;