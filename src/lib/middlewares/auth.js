const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, "your_jwt_secret", (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden: Invalid token
      }

      req.user = user;
      next(); // 토큰이 유효한 경우, 다음 미들웨어나 라우트 핸들러로 이동
    });
  } else {
    res.sendStatus(401); // Unauthorized: No token provided
  }
}
