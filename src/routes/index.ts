import express from "express";
import authRouter from "./auth.route";
import postRouter from "./post.route";

const router = express.Router();

export default (): express.Router => {
  authRouter(router);
  postRouter(router);
  return router;
};
