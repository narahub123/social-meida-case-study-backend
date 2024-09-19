import { checkToken } from "../middlewares/checkToken";
import { fetchUserInfo } from "../controllers/user.controller";
import { Router } from "express";

export default (router: Router) => {
  router.get("/fetchUserInfo", checkToken, fetchUserInfo);
};
