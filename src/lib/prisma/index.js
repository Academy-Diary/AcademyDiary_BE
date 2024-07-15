const { PrismaClient } = require("@prisma/client");

let option = {};
if (process.env.NODE_ENV === "prod") {
  pass;
} else {
  option = {
    // Prisma를 이용해 데이터베이스를 접근할 때, SQL을 출력
    log: ["query", "info", "warn", "error"],

    // 에러 메시지를 평문이 아닌, 개발자가 읽기 쉬운 형태로 출력
    errorFormat: "pretty",
  };
}

// 전체 애플리케이션에서 하나의 인스턴스만 재사용한다.
const prisma = new PrismaClient(option);

module.exports = prisma;
