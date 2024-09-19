import express from "express";
import authRouter from "./auth.route";
import postRouter from "./post.route";
import userRouter from "./user.route";

const router = express.Router();

export default (): express.Router => {
  authRouter(router);
  postRouter(router);
  userRouter(router);
  return router;
};
