const jwt = require("jsonwebtoken");
const { secretKey } = require("../../config/secret");

// 액세스 토큰을 생성하는 함수
const generateAccessToken = (payload) => {
    return jwt.sign(payload, secretKey, { expiresIn: '1h' });;
};

// 리프레시 토큰을 생성하는 함수
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: '7d' }); // 리프레시 토큰: 7일
};

// 리프레시 토큰을 사용하여 새로운 액세스 토큰을 생성
const refreshAccessToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, secretKey);
    const payload = {
      userId: decoded.userId,
      isAdmin: decoded.isAdmin,
    };
    return generateAccessToken(payload);
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken
};
