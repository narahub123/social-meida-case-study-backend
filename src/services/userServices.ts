import { User } from "../models/UserModel";

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
  ip: string
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
    });

    return newUser.save();
  } catch (error) {
    throw error;
  }
};

export { getUserByEmail, getUserByUserId, saveUser };
