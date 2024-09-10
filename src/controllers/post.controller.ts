import { asyncWrapper } from "../middlewares/asyncWrapper";
import { Forbidden } from "../errors";
import { Request, Response } from "express";

const baseUrl = process.env.BASE_URL;
const testPage = asyncWrapper(
  "testPage",
  async (req: Request, res: Response) => {
    let user = req.user;

    if (!user) {
      throw new Forbidden("로그인 필요");
    }
  }
);

export { testPage };
