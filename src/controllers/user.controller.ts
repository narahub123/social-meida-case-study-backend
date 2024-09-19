import express, { NextFunction, Request, Response } from "express";
import { getUserByUserId } from "../services/user.service";
import { asyncWrapper } from "../middlewares/asyncWrapper";

const fetchUserInfo = asyncWrapper(
  `fetchUserInfo`,
  async (req: Request, res: Response) => {
    const { userId } = req.user;
    console.log(userId);

    const user = await getUserByUserId(userId);
    console.log(user);
    res.status(200).json(user);
  }
);

export { fetchUserInfo };
