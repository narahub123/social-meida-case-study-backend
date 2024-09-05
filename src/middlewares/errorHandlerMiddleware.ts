import express from "express";
import { CustomAPIError } from "../errors";

export const errorHandlerMiddleware = (
  err: CustomAPIError,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "내부 에러";

  if (err.statusCode === 413) {
    return res.status(413).json({
      message: "요청 크기가 너무 큽니다. 데이터 크기를 줄여주세요.",
    });
  }

  return res.status(statusCode).json({ message });
};
