const { asyncWrapper } = require("../lib/middlewares/async");
const prisma = require("../lib/prisma/index");
const { CustomError } = require("../lib/errors/customError");
const ErrorCode = require("../lib/errors/errorCode");
const { StatusCodes } = require("http-status-codes");
const { getQuizDB } = require("../lib/mongo/mongo");
const { ObjectId } = require("mongodb"); // MongoDB ObjectId 가져오기
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GEMINI_API_KEY } = require("../config/secret");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// 헬퍼 함수
const createQuiztoExamDB = async (
  academy_id,
  lecture_id,
  quiz_name,
  quiz_date,
  next
) => {
  try {
    // ExamType Table에 시험유형, 'Quiz'가 없을 경우 생성
    let exam_type = await prisma.ExamType.findFirst({
      where: {
        academy_id: academy_id,
        exam_type_name: "퀴즈",
      },
    });

    let exam_type_id = exam_type?.exam_type_id;

    if (!exam_type_id) {
      exam_type = await prisma.ExamType.create({
        data: {
          academy_id: academy_id,
          exam_type_name: "퀴즈",
        },
      });
      exam_type_id = exam_type.exam_type_id;
    }

    // Exam Table에 퀴즈에 대한 정보 생성
    await prisma.Exam.create({
      data: {
        lecture_id: lecture_id,
        exam_name: quiz_name,
        exam_date: quiz_date,
        exam_type_id: exam_type_id,
      },
    });
  } catch (error) {
    console.error("Error in createQuiztoExamDB:", error);

    // Error Code P2003 처리
    if (error.code === "P2003") {
      return next(
        new CustomError(
          "해당 강의가 존재하지 않습니다.",
          StatusCodes.BAD_REQUEST,
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // 기타 에러 처리
    return next(
      new CustomError(
        "시험 생성에 실패하였습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  }
};

const generatePrompt = (keyword, n, count) => {
  const prompt = ` 다음조건에 맞춰 "${keyword}"에 맞는 퀴즈를 JSON형식으로 ${count}개 축제하시오.
- 주어진 주제에 대해 ${n}개 보기가 있는 객관식 문제 ${count}개 생성
- 출력은 모두 한국어로 작성
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
  let resultJSON, quiz;

  // 유효성 검사1: title, keyword가 존재하지 않는 경우 에러 처리
  if (!title || !keyword || !lecture_id) {
    return next(
      new CustomError(
        "모든 필드를 입력해주세요.",
        StatusCodes.BAD_REQUEST,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // createQuiztoExamDB Exam Table에 시험(퀴즈) 생성
  await createQuiztoExamDB(
    academy_id,
    lecture_id_int  ,
    title,
    new Date(),
    next
  );
  console.log("퀴즈 Exam Table 생성 완료");
  console.log("GEMINI API로 퀴즈 생성 시작");

  try {
    const prompt = generatePrompt(keyword, 4, 5); // GEMINI API 모델에 보낼 prompt 생성
    const result = await model.generateContent(prompt); // prompt 전달하여 퀴즈 생성
    const resultText = result.response.text();

    // 응답에서 불필요한 텍스트 제거
    console.log("Raw API Response:", resultText);
    const cleanedText = resultText.replace(/```json|```/g, "").trim();
    // JSON 파싱 유효성 검증
    if (!isValidJSON(cleanedText)) {
      console.error("Invalid JSON Response:", cleanedText);
      throw new CustomError(
        "GEMINI API에서 유효하지 않은 JSON을 반환했습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    resultJSON = JSON.parse(cleanedText);
    console.log("GEMINI API로 퀴즈 생성 완료", resultJSON);
  } catch (error) {
    console.error("Error in GEMINI API:", error);
    return next(
      new CustomError(
        "퀴즈 생성 중 오류가 발생했습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  }

  try {
    // quiz_list mongoDB에 저장
    const quizDB = getQuizDB();
    quiz = quizDB.collection("quizzes").insertOne({
      title: title,
      comment: comment,
      keyword: keyword,
      lecture_id: lecture_id_int,
      user_id: user_id,
      quiz_list: resultJSON.quiz_list,
      answer_list: resultJSON.answer_list,
    });
  } catch (error) {
    console.error("Error inserting quizzes into MongoDB:", error);
    return next(
      new CustomError(
        "퀴즈 저장 중 오류가 발생했습니다.",
        StatusCodes.INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  }

  return res.status(StatusCodes.CREATED).json({
    message: "퀴즈가 성공적으로 생성되었습니다.",
    data: quiz,
  });
});
