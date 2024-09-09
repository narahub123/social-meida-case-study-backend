import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

// jwt 생성하기
export const createToken = (
  _id: mongoose.Types.ObjectId,
  role: string,
  expiresIn: string
) => {
  // payload에 담을 데이터
  const payload = {
    _id,
    role,
  };

  // 보안키
  const secret = process.env.JWT_SECRET_KEY;

  // 옵션
  const options = {
    expiresIn,
  };

  return jwt.sign(payload, secret, options);
};

export const createAccessToken = (
  user: mongoose.Types.ObjectId,
  userRole: string
) => {
  return createToken(user, userRole, "1h");
};

export const createRefreshToken = (user: mongoose.Types.ObjectId) => {
  return createToken(user, "", "1d");
};

// access token refresh token 생성하기
export const createAccessAndRefreshTokens = (
  user: mongoose.Types.ObjectId,
  role: string
) => {
  const accessToken = createAccessToken(user, role);
  const refreshToken = createRefreshToken(user);

  return { accessToken, refreshToken };
};

// 장치 정보 알아내기
export const fetchDeviceInfo = (userAgent: string) => {
  const type = getDeviceType(userAgent);
  const os = getOsInfo(userAgent);
  const browser = getBrowserInfo(userAgent);

  return { type, os, browser };
};

// 장치 종류 알아내기
const getDeviceType = (userAgent: string) => {
  let deviceType = "";
  if (/mobile/i.test(userAgent)) {
    deviceType = "mobile";
  } else if (/tablet/i.test(userAgent)) {
    deviceType = "tablet";
  } else {
    deviceType = "desktop";
  }
  return deviceType;
};

// Os 알아내기
const getOsInfo = (userAgent: string) => {
  const osRegex =
    /(Windows NT \d+\.\d+|Mac OS X \d+_\d+|\bLinux\b|\bAndroid\b|\biPhone OS \d+_\d+)/i;
  const osMatch = userAgent.match(osRegex);
  const os = osMatch ? osMatch[0].replace(/_/g, ".") : "Unknown OS";

  return os;
};
// 브라우저 알아내기
const getBrowserInfo = (userAgent: string) => {
  const browserRegex =
    /(\bChrome\/[\d\.]+|\bFirefox\/[\d\.]+|\bSafari\/[\d\.]+|\bMSIE\s[\d\.]+|\bEdge\/[\d\.]+|Trident\/[\d\.]+)/i;
  const browserMatch = userAgent.match(browserRegex);
  const browser = browserMatch ? browserMatch[0] : "Unknown Browser";

  return browser;
};
