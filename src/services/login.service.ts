import mongoose from "mongoose";
import { Login } from "../models/login.model";
import { DeviceType, LoginType } from "../types/login.type";
import {
  BadRequest,
  DuplicateError,
  RequestTimeout,
  ServerUnavailable,
} from "../errors";

export const saveLoginInfo = async (loginInfo: LoginType) => {
  try {
    const newLoginInfo = new Login(loginInfo);
    return await newLoginInfo.save();
  } catch (error) {
    // 필수 필드 누락 등
    if (error.name === "ValidationError") {
      console.log("saveLoginInfo에서 에러", error.errors);

      throw new BadRequest("필수 필드 누락");
    } else if (error.code === 11000) {
      console.log("saveLoginInfo에서 에러", error.errors);
      throw new DuplicateError("로그인 중복 저장");
    } else if (
      error.name === "MongoNetworkError" ||
      error.name === "MongoServerError"
    ) {
      console.log("saveLoginInfo에서 에러", error.errors);
      throw new ServerUnavailable("MongoDB 연결 에러");
    } else {
      throw error;
    }
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
    if (error.name === "MongoError") {
      console.log("checkSameDeviceTypeAndUserAndIP에서 에러", error.errors);
      throw new BadRequest("잘못된 필드명 혹은 잘못된 데이터 형식");
    } else if (
      error.name === "MongoNetworkError" &&
      error.message.includes("timed out")
    ) {
      console.log("checkSameDeviceTypeAndUserAndIP에서 에러", error.errors);
      throw new RequestTimeout("서버 과부화로 접속 차단");
    } else if (
      error.name === "MongoNetworkError" ||
      error.name === "MongoServerError"
    ) {
      console.log("checkSameDeviceTypeAndUserAndIP에서 에러", error.errors);
      throw new ServerUnavailable("MongoDB 연결 에러");
    } else {
      throw error;
    }
  }
};

export const fetchLoginInfoById = async (loginId: mongoose.Types.ObjectId) => {
  try {
    return await Login.findById({ _id: loginId });
  } catch (error) {
    throw error;
  }
};
