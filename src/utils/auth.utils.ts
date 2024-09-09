import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { BadRequest, CustomAPIError } from "../errors";
import { LoginType } from "../types/login.type";
import {
  checkSameDeviceTypeAndUserAndIP,
  saveLoginInfo,
} from "../services/login.service";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_LOGIN_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_LOGIN_REDIRECT_URI = process.env.KAKAO_LOGIN_REDIRECT_URI;

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_REDIRECT_URI = process.env.NAVER_LOGIN_REDIRECT_URI;

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

// 소셜 로그인을 통해 유저 정보 얻기
export const getUserInfoByOauth = async (
  type: string,
  code: string,
  state?: string
) => {
  // 토큰 얻기
  const accessToken = await getToken(type, code, state);

  // 유저 정보 가져오기
  const userInfo = await getUserInfo(type, accessToken);

  return userInfo;
};
// 소셜 로그인 토큰 얻기
export const getToken = async (type: string, code: string, state?: string) => {
  let token_url = "";
  let body: any;
  let headers: { [key: string]: string } = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (type === "google") {
    token_url = "https://oauth2.googleapis.com/token";
    body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_LOGIN_REDIRECT_URI,
      code: code as string, // TypeScript에서는 코드 타입을 문자열로 지정
    });
  }

  if (type === "kakao") {
    token_url = "https://kauth.kakao.com/oauth/token";
    body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: KAKAO_LOGIN_REDIRECT_URI,
      code: code as string,
    });
  }

  if (type === "naver") {
    token_url = "https://nid.naver.com/oauth2.0/token";
    body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: NAVER_CLIENT_ID,
      client_secret: NAVER_CLIENT_SECRET,
      redirect_uri: NAVER_REDIRECT_URI,
      code: code,
      state: state,
    });

    headers = {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    };
  }

  const response = await fetch(token_url, {
    method: "POST",
    headers: headers,
    body: body.toString(),
  });

  if (!response.ok) {
    console.log(response.statusText);

    throw new CustomAPIError("토큰 획득 실패");
  }

  const data = await response.json();

  const ACCESS_TOKEN = data.access_token;

  return ACCESS_TOKEN;
};

// 유저 정보 얻기
export const getUserInfo = async (type: string, accessToken: string) => {
  let requestUrl = "";
  let userInfo: any;

  if (type === "google") {
    requestUrl = `https://www.googleapis.com/userinfo/v2/me`;
  }

  if (type === "kakao") {
    requestUrl = `https://kapi.kakao.com/v2/user/me`;
  }

  if (type === "naver") {
    requestUrl = "https://openapi.naver.com/v1/nid/me";
  }

  // 사용자 정보 취득하기
  const resData = await fetch(requestUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!resData.ok) {
    console.log("에러:", resData.statusText);
    throw new CustomAPIError("회원 정보 획득 실패");
  }

  userInfo = await resData.json();

  return userInfo;
};

// 로그인 정보 등록
export const checkLoginInfo = async (loginInfo: LoginType) => {
  // 동일 유저, ip, 장치를 이용한 로그인 여부 확인
  const isSavedLoginInfo = await checkSameDeviceTypeAndUserAndIP(
    loginInfo.user,
    loginInfo.ip,
    loginInfo.device
  );

  // 이미 등록된 정보가 아니라면 저장
  if (!isSavedLoginInfo || !isSavedLoginInfo.refreshToken) {
    const info = await saveLoginInfo(loginInfo);

    if (!info) {
      throw new BadRequest("로그인 등록 실패");
    }
  }
};
