const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerationController');
const { authenticateJWT } = require('../lib/middlewares/auth.js')

router.post('/request/academy', authenticateJWT, registerController.registerAcademy);

router.post('/request/user',authenticateJWT, registerController.registerUser);

router.post('/decide/user', authenticateJWT, registerController.decideUserStatus);

router.get('/list/user', authenticateJWT, registerController.listUser);

router.get('/list/academy', authenticateJWT, registerController.listAcademy);

// 보호된 라우트 예시
// router.get("/protected", authenticateJWT, (req, res) => {
//   res.json({ message: "This is a protected route", user: req.user });
// });

module.exports = router;
