const swaggerUi = require("swagger-ui-express")
const swaggerJsdoc = require("swagger-jsdoc")


const swaggerOptions = {
    swaggerDefinition: {
      openapi: "3.0.0", // Swagger 3.0 사용
      info: {
        title: "Academy Diary API",
        version: "1.0.0",
        description: "API documentation for the Academy Diary",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: ["./src/routes/*.js"], // 주석이 포함된 라우트 파일 경로
  };
const specs = swaggerJsdoc(swaggerOptions)

module.exports = { swaggerUi, specs }