import express from "express";
import authRouter from "./auth.route";

const router = express.Router();

export default (): express.Router => {
  authRouter(router);
  return router;
};
