import { User } from "../models/UserModel";

// 이메일로 유저 정보 확인하기
const getUserByEmail = async (email: string) => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    throw error;
  }
};

export { getUserByEmail };
