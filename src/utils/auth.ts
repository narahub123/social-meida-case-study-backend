import bcrypt from "bcryptjs";

// 해싱 패스워드 생성
export const createHashedPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);

  const hashedPassword = await bcrypt.hash(password, salt);

  return hashedPassword;
};

// 인증 번호 생성 : 6자리
export const createAuthCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
