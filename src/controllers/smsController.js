const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { getAuthDB } = require("../lib/mongo/mongo");
const nodemailer = require("nodemailer");
const Imap = require("node-imap");
const { simpleParser } = require("mailparser");
const { MAIL_USER, MAIL_PASSWORD } = require("../config/secret");

// OTP 생성 함수
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();


exports.requestOtp = asyncWrapper(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: "전화번호가 필요합니다." });
  }

  const otp = generateOtp();
  const otpData = {
    phoneNumber,
    otp,
    expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3분 후 만료
  };

  try {
    const db = getAuthDB();
    const collection = db.collection("mms");

    // TTL 인덱스 설정 (expiresAt 기준으로 자동 삭제)
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // OTP 저장
    await collection.insertOne(otpData);

    // 사용자에게 OTP 제공
    return res.status(200).json({
      message: "인증코드가 생성되었습니다.",
      otp, // 실제 환경에서는 클라이언트에 제공하지 않음
    });

  } catch (error) {
    console.error("OTP 생성 중 오류:", error.message);
    return res.status(500).json({ message: "OTP 생성 중 오류가 발생했습니다." });
  }
});


exports.verifyOtp = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: "휴대폰 번호를 입력해주세요." });
  }

  const imap = new Imap({
    user: MAIL_USER, // 이메일 계정
    password: MAIL_PASSWORD, // 이메일 비밀번호
    host: "imap.naver.com", // IMAP 서버 주소
    port: 993,
    tls: true,
  });

  // 응답 중복 방지 플래그
  let responseSent = false;

  const sendResponse = (status, message) => {
    if (!responseSent) {
      responseSent = true;
      res.status(status).json({ message });
    }
  };

  imap.once("ready", async () => {
    try {
      imap.openBox("INBOX", false, async (err, box) => {
        if (err) return sendResponse(500, "메일함 열기에 실패했습니다.");

        imap.search(["UNSEEN"], async (err, results) => {
          if (err) return sendResponse(500, "메일 검색 중 오류가 발생했습니다.");

          if (!results || results.length === 0) {
            return sendResponse(404, "새로운 메일이 없습니다.");
          }

          const fetch = imap.fetch(results, { bodies: "" });

          fetch.on("message", async (msg) => {
            let rawEmail = "";

            msg.on("body", (stream) => {
              stream.on("data", (chunk) => {
                rawEmail += chunk.toString("utf8");
              });
            });

            msg.once("end", async () => {
              try {
                const parsedEmail = await simpleParser(rawEmail);

                // 이메일 본문 디버깅
                console.log("이메일 본문:", parsedEmail.text);

                const sender = parsedEmail.from?.value[0]?.address;
                const codeMatch = parsedEmail.text.match(/\b\d{6}\b/); // 6자리 숫자 추출
                const code = codeMatch ? codeMatch[0].trim() : null;

                if (!sender || !code) {
                  return sendResponse(400, "발신자 또는 인증 코드를 찾을 수 없습니다.");
                }

                const db = getAuthDB();
                const collection = db.collection("mms");

                // 검색 조건 디버깅
                console.log("DB 검색 조건:", { phoneNumber: phoneNumber.trim(), otp: code });

                const record = await collection.findOne({
                  phoneNumber: phoneNumber.trim(), // 공백 제거
                  otp: code,
                });

                // 검색 결과 디버깅
                console.log("DB에서 검색된 레코드:", record);

                if (!record) {
                  return sendResponse(400, "인증코드가 유효하지 않습니다.");
                }

                return sendResponse(200, "인증 성공!");
              } catch (error) {
                console.error("메일 처리 중 오류:", error.message);
                return sendResponse(500, "메일 처리 중 오류가 발생했습니다.");
              }
            });
          });

          fetch.once("end", () => {
            imap.end();
          });
        });
      });
    } catch (error) {
      console.error("이메일 확인 중 오류:", error.message);
      return sendResponse(500, "이메일 확인 중 오류가 발생했습니다.");
    }
  });

  imap.once("error", (err) => {
    console.error("IMAP 연결 오류:", err.message);
    sendResponse(500, "IMAP 연결 오류가 발생했습니다.");
  });

  imap.connect();
};