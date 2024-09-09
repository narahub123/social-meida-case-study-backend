import mongoose from "mongoose";
import { Login } from "../models/login.model";
import { DeviceType, LoginType } from "../types/login.type";

export const saveLoginInfo = async (loginInfo: LoginType) => {
  try {
    const newLoginInfo = new Login(loginInfo);
    return await newLoginInfo.save();
  } catch (error) {
    throw error;
  }
};

// 동일 ip, user, device인 경우 확인 
export const checkSameDeviceTypeAndUserAndIP = async (
  user: mongoose.Types.ObjectId,
  ip: string,
  device: DeviceType
) => {
  try {
    return await Login.findOne({ user, ip, device });
  } catch (error) {
    throw error;
  }
};
