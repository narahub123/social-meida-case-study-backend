import { Auth } from "../models/auth.model";

// 인증 코드 저장하기
const saveAuthCode = async (userId: string, authCode: string) => {
  try {
    const newAuthCode = new Auth({
      userId,
      authCode,
    });
    return await newAuthCode.save();
  } catch (error) {
    throw error;
  }
};

export { saveAuthCode };
