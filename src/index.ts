import dotenv from "dotenv"; // .env 파일에 있는 환경 변수를 로드합니다.
dotenv.config(); // .env 파일에 정의된 환경 변수를 process.env로 로드합니다.
import express from "express"; // Express 프레임워크를 가져옵니다.
import http from "http"; // HTTP 서버를 생성하기 위해 기본 Node.js HTTP 모듈을 사용합니다.
import cookieParser from "cookie-parser"; // 쿠키를 파싱하기 위한 미들웨어를 가져옵니다.
import compression from "compression"; // HTTP 응답을 압축하기 위한 미들웨어를 가져옵니다.
import cors from "cors"; // Cross-Origin Resource Sharing (CORS)을 허용하기 위한 미들웨어를 가져옵니다.
import mongoose from "mongoose"; // MongoDB와의 연결을 위한 Mongoose 라이브러리를 가져옵니다.
import routes from "./routes";
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware";
// swagger ui
import swaggerUI from "swagger-ui-express";
import swaggerDocument from "../swagger.json";
// cloudinary 이미지 처리
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PORT = process.env.PORT || 8080; // .env 파일에서 PORT 환경 변수를 가져옵니다.

const app = express(); // Express 애플리케이션 인스턴스를 생성합니다.

// Swagger UI를 express에 통합
app.use("/swagger", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: "GET,POST,PUT,DELETE",
  })
);

// app.use(express.json());
app.use(express.json({ limit: "10mb" })); // JSON 요청 크기 제한을 10MB로 설정
app.use(express.urlencoded({ limit: "10mb", extended: true })); // URL-encoded 요청 크기 제한
app.use(compression()); // 모든 HTTP 응답을 압축하여 전송하도록 설정합니다.
app.use(cookieParser()); // 요청에서 쿠키를 파싱하여 사용할 수 있도록 설정합니다.

// 에러 핸들러 적용
app.use(errorHandlerMiddleware);

const server = http.createServer(app); // Express 애플리케이션을 기반으로 HTTP 서버를 생성합니다.

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`); // 서버가 주어진 포트에서 실행되면 콘솔에 로그를 출력합니다.
});

// MongoDB 데이터베이스와 연결 설정
mongoose.Promise = Promise; // Mongoose가 사용할 Promise 라이브러리를 설정합니다 (기본적으로 Node.js의 Promise 사용).
mongoose.connect(process.env.MONGO_URL); // .env 파일에서 MONGO_URL 환경 변수를 가져와 MongoDB에 연결합니다.
mongoose.connection.on("error", (error: Error) => console.log(error)); // MongoDB 연결에 오류가 발생하면 콘솔에 오류를 출력합니다.

app.use("/", routes());
