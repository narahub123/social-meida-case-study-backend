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

// 비밀번호 생성 8~16 자리
export const generatePassword = () => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+~<>?";

  // 적어도 하나씩 포함될 문자들을 각각 하나씩 선택
  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];

  // 나머지 자리를 임의의 문자들로 채우기
  const allChars = lowercase + uppercase + numbers + specialChars;
  const remainingLength = Math.floor(Math.random() * 9) + 4; // 4 ~ 12자리 추가 (최종 8 ~ 16자리)

  for (let i = 0; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // 비밀번호를 랜덤하게 섞기
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
};

// 비밀번호 확인하기
export const checkPassword = async (
  registeredPassword: string,
  password: string
) => {
  return await bcrypt.compare(password, registeredPassword);
};
