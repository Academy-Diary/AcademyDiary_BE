const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateJWT } = require('../lib/middlewares/auth.js');


router.delete("/:id", authenticateJWT("CHIEF"), teacherController.deleteTeacher);

router.get("/", authenticateJWT("CHIEF"), teacherController.getTeacher);

module.exports = router;