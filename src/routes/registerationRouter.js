const express = require('express');
const router = express.Router();
const regsiterController = require('../controllers/registerationController');
const { authenticateJWT } = require('../lib/middlewares/auth.js')

router.post('/request/academy', authenticateJWT, regsiterController.registAcademy);

router.post('/request/user',authenticateJWT, regsiterController.registUser);

// 보호된 라우트 예시
// router.get("/protected", authenticateJWT, (req, res) => {
//   res.json({ message: "This is a protected route", user: req.user });
// });

module.exports = router;
