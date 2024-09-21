const express = require("express");
const { authenticateJWT } = require("../lib/middlewares/auth.js");
const router = express.Router();
const expenseController = require("../controllers/expenseController.js");

//Class생성
router.post("/:academy_id", authenticateJWT, expenseController.createClass);

//Class조회
router.get("/:academy_id", authenticateJWT, expenseController.getClass);

//Class수정
router.put("/:academy_id", authenticateJWT, expenseController.updateClass);

//Class삭제
router.delete("/:class_id", authenticateJWT, expenseController.deleteClass);


module.exports = router;