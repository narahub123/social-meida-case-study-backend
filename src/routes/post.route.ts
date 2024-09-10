import { checkToken } from "../middlewares/checkToken";
import { testPage } from "../controllers/post.controller";
import { Router } from "express";

export default (router: Router) => {
  router.get("/test/enter", checkToken, testPage);
};
