const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/studentController');
const { authenticateJWT } = require('../lib/middlewares/auth.js');


module.exports = router;