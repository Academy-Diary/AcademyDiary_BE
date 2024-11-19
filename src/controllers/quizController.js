const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes, BAD_REQUEST } = require("http-status-codes");
const { getQuizDB } = require("../lib/mongo/mongo");
const { ObjectId } = require("mongodb"); // MongoDB ObjectId 가져오기
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GEMINI_API_KEY } = require("../config/secret");
const { getMongoClient } = require("../lib/mongo/mongo");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generatePrompt = (keyword, n, count) => {
  const prompt = ` 다음조건에 맞춰 "${keyword}"에 맞는 퀴즈를 JSON형식으로 ${count}개 축제하시오.
- 주어진 주제에 대해 ${n}개 보기가 있는 객관식 문제 ${count}개 생성
- 출력은 모두 한국어로 작성, 다만 영어를 써야하는 경우에는 영어로 작성(영어 문제를 만들 때에는 영어로 작성)
- 아래 예시와 같은 형태로 quiz-list와 answer-list 작성
- 예시(quiz-list, answer-list)
- quiz_list : [ {{question : "1+1은 무엇인가요?", options : ["1", "3", "모름", "2"], answer : {{"3": "2"}}, "explanation": "자명하다"}},
{{question : "바나나는 무엇인가요?", options : ["과일", "고기", "모름", "나물"], answer : {{"0": "과일"}}, "explanation": "백과사전 참고"}}, ...]
answer_list : [3, 0, ... ]
- (answer_list의 값들은 각 quiz options 중에서 옳은 index값을 나타닌다.)
`;
  return prompt;
};

function isValidJSON(text) {
  try {
    JSON.parse(text);
    return true;
  } catch (error) {
    return false;
  }
}
// 퀴즈 생성
exports.createQuiz = asyncWrapper(async (req, res, next) => {
  const { title, lecture_id, comment, keyword } = req.body;
  const lecture_id_int = parseInt(lecture_id, 10);
  const academy_id = req.user.academy_id;
  const user_id = req.user.user_id;

  if (!title || !keyword || !lecture_id) {
    return next(
      new CustomError(
        "모든 필드를 입력해주세요.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const mongoClient = getMongoClient();
  const session = mongoClient.startSession();

  try {
    console.time("전체 트랜잭션 실행 시간");
    console.time("MySQL 트랜잭션");

    // 1. Prisma 트랜잭션
    const prismaTransactionResult = await prisma.$transaction(
      async (prisma) => {
        // ExamType 찾기 또는 생성
        let examType = await prisma.ExamType.findFirst({
          where: {
            academy_id: academy_id,
            exam_type_name: "퀴즈",
          },
        });

        if (!examType) {
          examType = await prisma.ExamType.create({
            data: {
              academy_id: academy_id,
              exam_type_name: "퀴즈",
            },
          });
        }

        // Exam 생성
        const exam = await prisma.Exam.create({
          data: {
            lecture_id: lecture_id_int,
            exam_name: title,
            exam_date: new Date(),
            exam_type_id: examType.exam_type_id,
          },
        });

        return { exam, examType };
      }
    );

    console.log("MySQL 트랜잭션 성공:", prismaTransactionResult);
    console.timeEnd("MySQL 트랜잭션");

    // 2. GEMINI API 호출
    console.time("GEMINI API 호출");
    const prompt = generatePrompt(keyword, 4, 5);
    const result = await model.generateContent(prompt);
    const resultText = result.response.text();
    const cleanedText = resultText.replace(/```json|```/g, "").trim();

    if (!isValidJSON(cleanedText)) {
      throw new CustomError(
        "GEMINI API에서 유효하지 않은 JSON을 반환했습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    const resultJSON = JSON.parse(cleanedText);
    console.timeEnd("GEMINI API 호출");
    const quizData = {
      title: title,
      comment: comment,
      keyword: keyword,
      exam_id: prismaTransactionResult.exam.exam_id,
      user_id: user_id,
      quiz_list: resultJSON.quiz_list,
      answer_list: resultJSON.answer_list,
    };

    // 3. MongoDB 트랜잭션
    console.time("MongoDB 트랜잭션");
    await session.withTransaction(async () => {
      const quizCollection = mongoClient.db("Quiz").collection("quizzes");
      await quizCollection.insertOne(quizData, { session });
    });
    console.timeEnd("MongoDB 트랜잭션");

    console.log("전체 트랜잭션 성공");
    console.timeEnd("전체 트랜잭션 실행 시간");

    return res.status(StatusCodes.CREATED).json({
      message: "퀴즈가 성공적으로 생성되었습니다.",
      data: quizData,
    });
  } catch (error) {
    console.error("에러 발생 -> 트랜잭션 실패:", error);
    if (error.code === "P2003") {
      return next(
        new CustomError(
          `${lecture_id_int}에 해당하는 강의가 존재하지 않습니다.`,
          StatusCodes.BAD_REQUEST,
          StatusCodes.BAD_REQUEST
        )
      );
    }
    return next(
      new CustomError(
        "API 실행 중 오류가 발생했습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  } finally {
    session.endSession();
    await prisma.$disconnect();
  }
});

exports.getQuiz = asyncWrapper(async (req, res, next) => {
  const { exam_id, quiz_num } = req.params;

  if (!exam_id || !quiz_num) {
    return next(
      new CustomError(
        "exam_id와 quiz_num은 필수입니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const exam_id_int = parseInt(exam_id, 10);
  const quiz_num_int = parseInt(quiz_num, 10);

  if (isNaN(exam_id_int) || isNaN(quiz_num_int)) {
    return next(
      new CustomError(
        "quiz_num은 숫자여야 합니다.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const mongoClient = getMongoClient();
  try {
    const quizCollection = getQuizDB().collection("quizzes");

    // exam_id로 퀴즈 데이터 조회
    const quizData = await quizCollection.findOne({ exam_id: exam_id_int });

    if (!quizData) {
      return next(
        new CustomError(
          `${exam_id}에 해당하는 퀴즈가 존재하지 않습니다.`,
          StatusCodes.NOT_FOUND,
          StatusCodes.NOT_FOUND
        )
      );
    }

    // quiz_num이 범위를 벗어났는지 확인
    if (quiz_num_int < 0 || quiz_num_int >= quizData.quiz_list.length) {
      return next(
        new CustomError(
          `quiz_num이 유효하지 않습니다. 범위: 0 ~ ${
            quizData.quiz_list.length - 1
          }`,
          StatusCodes.BAD_REQUEST,
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // 해당 quiz_num의 문제 반환
    const quiz = quizData.quiz_list[quiz_num_int];

    return res.status(StatusCodes.OK).json({
      [quiz_num_int]: quiz,
    });
  } catch (error) {
    console.error("퀴즈 조회 중 오류 발생:", error);
    return next(
      new CustomError(
        "퀴즈 데이터를 불러오는 중 문제가 발생했습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  } finally {
    await mongoClient.close();
  }
});
