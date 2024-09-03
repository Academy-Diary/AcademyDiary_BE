const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateJWT } = require('../lib/middlewares/auth.js');


router.delete("/:id", authenticateJWT, teacherController.deleteTeacher);

router.get("/", authenticateJWT, teacherController.getTeacher);

module.exports = router;