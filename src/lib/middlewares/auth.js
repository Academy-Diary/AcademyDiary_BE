const jwt = require("jsonwebtoken");
const { secretKey } = require("../../config/secret.js");

//로그인했는지 검사
function authenticateJWT(...allowedRoles) {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        const token = authHeader.split(" ")[1];

        jwt.verify(token, secretKey, (err, user) => {
          if (err) {
            return res.sendStatus(403).send({ message: '토큰 검증 실패' }); // Forbidden: Invalid token
          }
          if(!allowedRoles.includes(user.role)) {
            return res.status(403).send({ message: '권한이 없습니다.' });
          }

          req.user = user;
          next(); // 토큰이 유효한 경우, 다음 미들웨어나 라우트 핸들러로 이동
        });
      } else {
        res.sendStatus(401); // Unauthorized: No token provided
      }
  }
}

module.exports = { authenticateJWT };
