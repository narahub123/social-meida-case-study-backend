import express from "express";
import CustomAPIError from "../errors/custom-error";

export const errorHandlerMiddleware = (
  err: CustomAPIError,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "내부 에러";

  return res.status(statusCode).json({ message });
};
