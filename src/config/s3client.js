const { S3Client } = require("@aws-sdk/client-s3");
const {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} = require("./secret.js");

const s3 = new S3Client({
  region: AWS_REGION,
  endpoint: `https://s3.${AWS_REGION}.amazonaws.com`, // 명확히 리전 기반 엔드포인트 설정
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = s3;
