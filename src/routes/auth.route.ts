import {
  checkExistingEmail,
  sendAuthCodeEmail,
  checkExistingUserId,
  creatNewUser,
  verifyAuthCode,
  normalLogin,
  integrateSocial,
  googleSignup,
  naverSignup,
  naverRequest,
  saveNaverSettings,
  kakaoSignup,
  oauthLogin,
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
  router.post("/auth/google/signup", googleSignup);
  router.get("/auth/naver/signup", naverRequest);
  router.get(`/auth/naver/callback`, naverSignup);
  router.post(`/auth/naver/settings`, saveNaverSettings);
  router.get("/auth/kakao/callback", kakaoSignup);
  router.get(`/auth/oauth/login/callback`, oauthLogin);
};
