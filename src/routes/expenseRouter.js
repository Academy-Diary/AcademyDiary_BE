const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const expenseController = require("../controllers/expenseController.js");

//Class생성
router.post("/:academy_id", authenticateJWT("CHIEF"), expenseController.createClass);

//Class조회
router.get("/:academy_id", authenticateJWT("CHIEF","TEACHER"), expenseController.getClass);

//Class수정
router.put("/:academy_id/:class_id", authenticateJWT("CHIEF"), expenseController.updateClass);

//Class삭제
router.delete("/:academy_id/:class_id", authenticateJWT("CHIEF"), expenseController.deleteClass);


module.exports = router;