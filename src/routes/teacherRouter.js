const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateJWT } = require('../lib/middlewares/auth.js');


router.delete("/:id", teacherController.deleteTeacher);

router.get("/", teacherController.getTeacher);