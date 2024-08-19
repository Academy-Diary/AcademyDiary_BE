const express = require('express');
const router = express.Router();
const regsiterController = require('../controllers/registerationController');

router.post('/request', regsiterController.registAcademy);

module.exports = router;
