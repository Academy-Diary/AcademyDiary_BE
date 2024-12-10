const axios = require("axios");
const qs = require("qs");
const { ALIGO_API_KEY, ALIGO_SENDER, ALIGO_USER_ID } = require("../../config/secret");

/**
 * 알리고 SMS 전송 함수
 * @param {string} phoneNumber - 수신자 전화번호
 * @param {string} message - 전송할 메시지
 * @returns {Promise<object>} - SMS 전송 결과
 */
async function sendSms(phoneNumber, message) {
  try {
    const url = "https://apis.aligo.in/send/";

    // 요청 데이터
    const data = qs.stringify({
      key: ALIGO_API_KEY,
      user_id: ALIGO_USER_ID,
      sender: ALIGO_SENDER,
      receiver: phoneNumber,
      msg: message,
    });

    // API 호출
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data;
  } catch (error) {
    console.error("SMS 전송 중 오류 발생:", error);
    throw error;
  }
}

module.exports = { sendSms };