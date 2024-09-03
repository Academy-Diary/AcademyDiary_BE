const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateJWT } = require('../lib/middlewares/auth.js');


router.delete("/:user_id", studentController.deleteStudent);

module.exports = router;