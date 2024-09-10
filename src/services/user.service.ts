import mongoose from "mongoose";
import {
  BadRequest,
  CustomAPIError,
  DuplicateError,
  RequestTimeout,
  ServerUnavailable,
} from "../errors";
import { User } from "../models/user.model";

// 이메일로 유저 정보 확인하기
const getUserByEmail = async (email: string) => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    if (error.name === "MongoError") {
      console.log("getUserByEmail에서 에러", error.errors);
      throw new BadRequest("잘못된 필드명 혹은 잘못된 데이터 형식");
    } else if (
      error.name === "MongoNetworkError" &&
      error.message.includes("timed out")
    ) {
      console.log("getUserByEmail에서 에러", error.errors);
      throw new RequestTimeout("서버 과부화로 접속 차단");
    } else if (
      error.name === "MongoNetworkError" ||
      error.name === "MongoServerError"
    ) {
      console.log("getUserByEmail에서 에러", error.errors);
      throw new ServerUnavailable("MongoDB 연결 에러");
    } else {
      throw error;
    }
  }
};

// 이메일로 유저 정보 확인하기
const getUserById = async (_id: mongoose.Types.ObjectId) => {
  try {
    return await User.findById({ _id });
  } catch (error) {
    if (error.name === "MongoError") {
      console.log("getUserByEmail에서 에러", error.errors);
      throw new BadRequest("잘못된 필드명 혹은 잘못된 데이터 형식");
    } else if (
      error.name === "MongoNetworkError" &&
      error.message.includes("timed out")
    ) {
      console.log("getUserByEmail에서 에러", error.errors);
      throw new RequestTimeout("서버 과부화로 접속 차단");
    } else if (
      error.name === "MongoNetworkError" ||
      error.name === "MongoServerError"
    ) {
      console.log("getUserByEmail에서 에러", error.errors);
      throw new ServerUnavailable("MongoDB 연결 에러");
    } else {
      throw error;
    }
  }
};

// 아이디로 유저 정보 확인하기
const getUserByUserId = async (userId: string) => {
  try {
    return await User.findOne({ userId });
  } catch (error) {
    throw error;
  }
};

// 유저 저장하기
const saveUser = async (
  username: string,
  email: string,
  birth: string,
  hashedPassword: string,
  userId: string,
  userPic: string,
  gender: string,
  location: string,
  ip: string,
  isAuthenticated?: boolean,
  social?: string
) => {
  try {
    const newUser = new User({
      username,
      email,
      birth,
      password: hashedPassword,
      userId,
      userPic,
      gender,
      location,
      ip,
      isAuthenticated,
      social,
    });

    return newUser.save();
  } catch (error) {
    throw error;
  }
};

// 인증 여부 업데이트
const updateIsAuthenticated = async (
  userId: string,
  isAuthenticated: boolean
) => {
  try {
    return await User.updateOne({ userId }, { $set: { isAuthenticated } });
  } catch (error) {
    throw error;
  }
};

// 소셜 로그인 추가하기
const updateSocial = async (email: string, social: string[]) => {
  try {
    return await User.updateOne({ email }, { $set: { social } });
  } catch (error) {
    // 필수 필드 누락 등
    if (error.name === "ValidationError") {
      console.log("updateSocial에서 에러", error.errors);
      throw new BadRequest("필수 필드 누락");
    } else if (error.code === 11000) {
      console.log("updateSocial에서 에러", error.errors);
      throw new DuplicateError("로그인 정보 중복");
    } else if (
      error.name === "MongoNetworkError" ||
      error.name === "MongoServerError"
    ) {
      console.log("updateSocial에서 에러", error.errors);
      throw new ServerUnavailable("MongoDB 연결 에러");
    } else {
      throw error;
    }
  }
};

export {
  getUserByEmail,
  getUserById,
  getUserByUserId,
  saveUser,
  updateIsAuthenticated,
  updateSocial,
};
