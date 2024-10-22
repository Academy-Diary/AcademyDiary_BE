const jwt = require("jsonwebtoken");
const { secretKey } = require("../../config/secret.js");

// 액세스 토큰을 생성하는 함수
const generateAccessToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: "1h" });
};

// 리프레시 토큰을 생성하는 함수
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: "7d" }); // 리프레시 토큰: 7일
};

// 리프레시 토큰을 사용하여 새로운 액세스 토큰을 생성
const generateNewTokens = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, secretKey);
    console.log("decoded:", decoded);
    const payload = {
      user_id: decoded.user_id,
      role: decoded.role,
      academy_id: decoded.academy_id,
    };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    console.log("New Access Token:", newAccessToken);
    console.log("New Refresh Token:", newRefreshToken);

    return {
      newAccessToken,
      newRefreshToken,
    };

  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateNewTokens,
};
