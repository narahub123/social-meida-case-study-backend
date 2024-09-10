import { CustomAPIError } from "errors";
import { NextFunction, Request, Response } from "express";

export const errorHandlerMiddleware = (
  err: CustomAPIError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "내부 에러";
  const statusText = err.statusText || "internal server error";

  if (err.statusCode === 413) {
    return res.status(413).json({
      message: "요청 크기가 너무 큽니다. 데이터 크기를 줄여주세요.",
    });
  }

  if (err.code && err.code === 11000) {
    console.log(err);

    res.status(409).json({ message: "중복된 데이터가 있습니다." });
  }

  res.status(statusCode).json({ message, success: statusText });
};
