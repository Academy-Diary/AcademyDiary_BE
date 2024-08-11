const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET_KEY;

// 새로운 토큰을 생성하는 함수
const generateToken = (payload) => {
  const token = jwt.sign(payload, secretKey, { expiresIn: '10m' });
    return token;
};

// 기존 토큰을 사용하여 새로운 토큰을 생성하는 함수
const refreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, secretKey);
    const payload = {
      userId: decoded.userId,
      isAdmin: decoded.isAdmin,
    };
    const newToken = generateToken(payload);
    return newToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};
