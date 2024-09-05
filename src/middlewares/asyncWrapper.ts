import { NextFunction, Request, Response } from "express";

export const asyncWrapper = (
  controllerName: string,
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.log(`${controllerName}에서 에러 발생 : `, error.message);

      next(error);
    }
  };
};
