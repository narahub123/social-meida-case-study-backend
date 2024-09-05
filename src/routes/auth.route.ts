import {
  checkExistingEmail,
  sendAuthCodeEmail,
  checkExistingUserId,
  creatNewUser,
  verifyAuthCode,
} from "../controllers/auth.controller";
import express from "express";

export default (router: express.Router) => {
  router.post("/auth/sendAuthEmail", sendAuthCodeEmail);
  router.post("/auth/checkExistingEmail", checkExistingEmail);
  router.post("/auth/checkExistingUserId", checkExistingUserId);
  router.post("/auth/signup", creatNewUser);
  router.get("/auth/verifyAuthCode", verifyAuthCode);
};
