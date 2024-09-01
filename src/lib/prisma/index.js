const { PrismaClient } = require("@prisma/client");

let option = {};
if (process.env.NODE_ENV === "prod") {
  // Production 환경에서는 로그를 최소화하고, 에러 메시지를 기본 형식으로 설정
  option = {
    log: [],  // 로그를 출력하지 않음
    errorFormat: "minimal",  // 에러 메시지를 기본 형식으로 출력
  };
} else {
  option = {
    // Development 환경에서는 SQL 쿼리 로그를 출력하고, 에러 메시지를 읽기 쉬운 형태로 설정
    log: ["query", "info", "warn", "error"],
    errorFormat: "pretty",
  };
}

// 전체 애플리케이션에서 하나의 인스턴스만 재사용한다.
const prisma = new PrismaClient(option);

module.exports = prisma;
