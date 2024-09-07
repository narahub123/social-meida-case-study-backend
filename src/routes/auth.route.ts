import {
  checkExistingEmail,
  sendAuthCodeEmail,
  checkExistingUserId,
  creatNewUser,
  verifyAuthCode,
  normalLogin,
  integrateSocial,
} from "../controllers/auth.controller";
import express from "express";

export default (router: express.Router) => {
  router.post("/auth/checkExistingEmail", checkExistingEmail);
  router.post("/auth/checkExistingUserId", checkExistingUserId);
  router.post("/auth/signup", creatNewUser);
  router.get("/auth/verifyAuthCode", verifyAuthCode);
  router.post("/auth/requestAuthCode", sendAuthCodeEmail);
  router.post("/auth/login", normalLogin);
  router.post("/auth/signup/integrate", integrateSocial);
};
