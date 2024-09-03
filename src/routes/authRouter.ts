import {
  checkExistingEmail,
  sendAuthCodeEmail,
  checkExistingUserId,
} from "../controllers/authControllers";
import express from "express";

export default (router: express.Router) => {
  router.post("/auth/sendAuthEmail", sendAuthCodeEmail);
  router.post("/auth/checkExistingEmail", checkExistingEmail);
  router.post("/auth/checkExistingUserId", checkExistingUserId);
};
