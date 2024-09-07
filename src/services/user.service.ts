import { User } from "../models/user.model";

// 이메일로 유저 정보 확인하기
const getUserByEmail = async (email: string) => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    throw error;
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

const updateSocial = async (email: string, social: string) => {
  try {
    return await User.updateOne({ email }, { $set: { social } });
  } catch (error) {
    throw error;
  }
};
export {
  getUserByEmail,
  getUserByUserId,
  saveUser,
  updateIsAuthenticated,
  updateSocial,
};
