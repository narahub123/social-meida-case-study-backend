import { Login } from "../models/login.model";
import { LoginType } from "../types/login.type";

export const saveLoginInfo = async (loginInfo: LoginType) => {
  try {
    const newLoginInfo = new Login(loginInfo);
    return await newLoginInfo.save();
  } catch (error) {
    throw error;
  }
};
