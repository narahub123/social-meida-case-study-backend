import express, { NextFunction, Request, Response } from "express";
import { sendEmail } from "../services/email.service";
import {
  getUserByEmail,
  getUserByUserId,
  saveUser,
  updateIsAuthenticated,
  updateSocial,
} from "../services/user.service";
import { saveUserSettings } from "../services/userSettings.service";
import { BadRequest, CustomAPIError, DuplicateError } from "../errors";
import {
  checkPassword,
  createAccessAndRefreshTokens,
  createAuthCode,
  createHashedPassword,
  createToken,
  fetchDeviceInfo,
  generatePassword,
} from "../utils/auth.utils";
import { saveImageToCloudinary } from "../utils/cloudinary";
import { asyncWrapper } from "../middlewares/asyncWrapper";
import { fetchAuthByUserId, saveAuthCode } from "../services/auth.service";
import {
  checkSameDeviceTypeAndUserAndIP,
  saveLoginInfo,
} from "../services/login.service";
import { DeviceType } from "types/login.type";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL;

// 이메일 중복확인
const checkExistingEmail = asyncWrapper(
  "checkExistingEmail",
  async (req: express.Request, res: express.Response) => {
    const { email, social } = req.body;

    if (!email) {
      throw new BadRequest("이메일을 제공해주세요.");
    }

    // 소셜에 대한 정보가 있는 경우 해당 이메일과 소셜이 모두 해당되는지 여부를 확인해야 함
    if (social) {
      const user = await getUserByEmail(email);

      // 동일 이메일을 사용하는 유저가 있는 경우
      if (user) {
        // 유저 계정에 해당 소셜이 포함되어 있는지 확인
        const hasSocial = user.social.includes(social);

        // 이미 등록된 소셜 계정인 경우 로그인 유도
        if (hasSocial) {
          throw new DuplicateError("이미 등록된 소셜 계정입니다.");
        }

        // 소셜 등록이 안된 경우
        throw new DuplicateError("이미 존재하는 이메일입니다.");
      }
      // 소셜에 대한 정보가 없는 경우
    } else {
      // 이메일 중복 확인
      const existingEmail = await getUserByEmail(email);

      // 중복이 있는 경우
      if (existingEmail) {
        throw new DuplicateError("이미 존재하는 이메일입니다.");
      }
    }

    res.status(200).json({ message: "사용 가능한 이메일입니다." });
  }
);

// 아이디 중복 체크
const checkExistingUserId = asyncWrapper(
  "checkExistingUserId",
  async (req: express.Request, res: express.Response) => {
    const { userId } = req.body;
    if (!userId) {
      throw new BadRequest("userId를 제공해주세요.");
    }

    const existingUserId = await getUserByUserId(userId);

    if (existingUserId) {
      throw new DuplicateError("이미 존재하는 아이디입니다.");
    }

    res.status(200).json({ message: "사용 가능한 아이디입니다." });
  }
);

// 유저 생성
const creatNewUser = asyncWrapper(
  "creatNewUser",
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      username,
      email,
      birth,
      password,
      userId,
      imgUrl,
      alarms,
      language,
      gender,
      location,
      ip,
    } = req.body;

    // body로부터 받은 데이터가 다 있는지 확인
    // imgUrl은 선택사항이기 때문에 제외
    if (
      !username ||
      !email ||
      !birth ||
      !password ||
      !userId ||
      !location ||
      !ip ||
      !gender
    ) {
      const missingsArr = [];

      if (!username) {
        missingsArr.push("username");
      }
      if (!email) {
        missingsArr.push("email");
      }
      if (!birth) {
        missingsArr.push("birth");
      }
      if (!password) {
        missingsArr.push("password");
      }
      if (!userId) {
        missingsArr.push("userId");
      }
      if (!location) {
        missingsArr.push("location");
      }
      if (!ip) {
        missingsArr.push("ip");
      }
      if (gender) {
        missingsArr.push("gender");
      }

      const missings = missingsArr.join(", ");

      throw new BadRequest(`${missings}에 대한 정보를 제공해주세요.`);
    }

    // 동일한 이메일 존재 여부 확인
    const duplicateEmailUser = await getUserByEmail(email);

    if (duplicateEmailUser) {
      // return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
      throw new DuplicateError("이미 존재하는 아이디입니다.");
    }

    // 동일한 아이디 존재 여부 확인
    const duplicateUserIdUser = await getUserByUserId(userId);

    if (duplicateUserIdUser) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }

    // 비밀번호 해싱
    const hashedPassword = await createHashedPassword(password);

    // 이미지 저장
    let userPic = "";
    // 이미지 url이 전송된 경우 이미지를 cloudinary에 저장하고 url을 가져옴
    if (imgUrl) {
      userPic = await saveImageToCloudinary(imgUrl);
    }

    // 정보 저장하고 이메일 전송하기
    const user = await saveUser(
      username,
      email,
      birth,
      hashedPassword,
      userId,
      userPic,
      gender,
      location,
      ip
    );

    if (!user) {
      throw new BadRequest(`회원 가입 실패`);
    }

    const userSettings = await saveUserSettings(userId, alarms, language);

    if (!userSettings) {
      throw new BadRequest("회원 가입이 실패했습니다.");
    }

    // 이메일 전송
    // 인증 번호 생성하기
    const authCode = createAuthCode();

    // 인증 번호 저장하고 만료시간 가져오기
    const auth = await saveAuthCode(userId, authCode);

    if (!auth) {
      throw new BadRequest("인증 코드 등록에 실패했습니다.");
    }

    // 제목
    const subject = "PlayGround 인증코드";
    // 내용
    const html = `<div><p>PlayGround 인증코드 : ${authCode}</p><p>인증 코드는 ${auth.authExpiredAt}에 만료됩니다.</p></div>`;
    const info = await sendEmail(email, subject, html);

    if (!info) {
      throw new BadRequest(`이메일 전송 실패`);
    }

    res.status(201).json({ message: "회원 가입 성공" });
  }
);

// 인증 번호 확인하기
const verifyAuthCode = asyncWrapper(
  "verifyAuthCode",
  async (req: Request, res: Response) => {
    const { authCode, userId, email } = req.query;

    let auth;
    if (userId) {
      auth = await fetchAuthByUserId(userId.toString());
    } else if (email) {
      const user = await getUserByEmail(email.toString());

      if (!user) {
        return res
          .status(404)
          .json({ message: "가입자가 없습니다.", success: "unregistered" });
      }

      auth = await fetchAuthByUserId(userId.toString());
    }

    if (!auth) {
      return res.status(404).json({ message: "인증 만료", success: "expired" });
    }

    if (auth.authCode !== authCode.toString()) {
      return res
        .status(400)
        .json({ message: "잘못된 인증 코드", success: "bad request" });
    }

    const user = await updateIsAuthenticated(userId.toString(), true);

    if (user.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "미등록 가입자", success: "unregistered" });
    }

    console.log(user);

    return res.status(200).json({ message: "인증 성공", success: "ok" });
  }
);

// 인증 코드 보내기
const sendAuthCodeEmail = asyncWrapper(
  "sendAuthCodeEmail",
  async (req: express.Request, res: express.Response) => {
    const { userId, email } = req.body;

    if (!userId && !email) {
      throw new BadRequest("이메일 혹은 사용자 아이디를 전송해주세요.");
    }

    let user;
    if (userId) {
      user = await getUserByUserId(userId);
    } else if (email) {
      user = await getUserByEmail(email);
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "가입자 없음", success: "unregistered" });
    }

    // 이메일 전송
    // 인증 번호 생성하기
    const authCode = createAuthCode();

    // 인증 번호 저장하고 만료시간 가져오기
    const auth = await saveAuthCode(userId, authCode);

    if (!auth) {
      throw new BadRequest("인증 코드 등록에 실패했습니다.");
    }

    // 제목
    const subject = "PlayGround 인증코드";
    // 내용
    const html = `<div><p>PlayGround 인증코드 : ${authCode}</p><p>인증 코드는 ${auth.authExpiredAt}에 만료됩니다.</p></div>`;
    const info = await sendEmail(user.email, subject, html);

    if (!info) {
      throw new BadRequest(`이메일 전송 실패`);
    }

    res.status(200).json({ message: "인증 코드가 발송되었습니다." });
  }
);

// 이메일에 소셜 미디어 통합하기
const integrateSocial = asyncWrapper(
  "integrateSocial",
  async (req: Request, res: Response) => {
    const { social, email } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "유저 부존재" });
    }

    if (user.social === social) {
      throw new DuplicateError("이미 등록된 계정입니다.");
    }

    const updatedUser = await updateSocial(email, social);

    if (updatedUser.modifiedCount === 0) {
      return res
        .status(400)
        .json({ message: "업데이트 실패", success: "fail" });
    }

    res.status(200).json({ message: "업데이트 성공", success: "ok" });
  }
);

// 구글 회원 가입
const googleSignup = asyncWrapper(
  "googleSignup",
  async (req: Request, res: Response) => {
    const {
      userId,
      username,
      email,
      userPic,
      location,
      ip,
      gender,
      birth,
      alarms,
      language,
    } = req.body;
    // 로그인한 사용자의 장치에 대한 정보
    const deviceInfo = req.headers["user-agent"];

    // 유효성 검사
    if (
      !userId ||
      !username ||
      !email ||
      !location ||
      !ip ||
      !gender ||
      !birth
    ) {
      const missingsArr = [];
      if (!userId) {
        missingsArr.push("userId");
      }
      if (!username) {
        missingsArr.push("username");
      }
      if (!email) {
        missingsArr.push("email");
      }
      if (!birth) {
        missingsArr.push("birth");
      }
      if (gender) {
        missingsArr.push("gender");
      }
      if (!location) {
        missingsArr.push("location");
      }
      if (!ip) {
        missingsArr.push("ip");
      }

      const missings = missingsArr.join(", ");

      throw new BadRequest(`${missings}에 대한 정보를 제공해주세요.`);
    }

    // 동일한 이메일 존재 여부 확인
    const duplicateEmailUser = await getUserByEmail(email);

    if (duplicateEmailUser) {
      // return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
      throw new DuplicateError("이미 존재하는 아이디입니다.");
    }

    // 동일한 아이디 존재 여부 확인
    const duplicateUserIdUser = await getUserByUserId(userId);

    if (duplicateUserIdUser) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }

    // 임의의 비밀번호 생성
    const hashedPassword = generatePassword();

    const isAuthenticated = true;
    const social = "google";

    // 정보저장하기
    const user = await saveUser(
      username,
      email,
      birth,
      hashedPassword,
      userId,
      userPic,
      gender,
      location,
      ip,
      isAuthenticated,
      social
    );

    if (!user) {
      throw new BadRequest(`회원 가입 실패`);
    }

    // 설정 저장하기
    const userSettings = await saveUserSettings(userId, alarms, language);

    if (!userSettings) {
      throw new BadRequest("설정 저장에 실패했습니다.");
    }

    // 토큰 생성
    // access token 생성
    const { accessToken, refreshToken } = createAccessAndRefreshTokens(
      user._id,
      user.userRole
    );

    // 로그인 정보를 기록
    // 장치 정보 알아내기
    const device: DeviceType = fetchDeviceInfo(deviceInfo);

    const loginInfo = {
      user: user._id,
      refreshToken,
      device,
      ip,
      location,
    };

    // 동일 유저, ip, 장치를 사용한 로그인 여부 확인
    const isSavedInfo = await checkSameDeviceTypeAndUserAndIP(
      user._id,
      ip,
      device
    );

    // 이미 기록된 로그인이 아닌 경우에만 저장
    if (!isSavedInfo) {
      const info = await saveLoginInfo(loginInfo);

      if (!info) {
        throw new BadRequest("로그인 정보 등록 실패");
      }
    }

    // 쿠키 전송
    res.cookie("access", accessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.status(200).json({ message: "회원 가입 성공", success: "ok" });
  }
);

// 네이버 회원 가입
const naverRequest = asyncWrapper(
  "naverRequest",
  async (req: Request, res: Response) => {
    const { state } = req.query;

    const naver_redirect_url = `http://localhost:8080/auth/naver/callback`;
    const naver_api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${
      process.env.NAVER_CLIENT_ID
    }&redirect_uri=${naver_redirect_url}&state=${state.toString()}`;

    const response = await fetch(naver_api_url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Naver API 요청에 실패했습니다.");
    }
  }
);

// 네이버 회원 가입
const naverSignup = asyncWrapper(
  "naverSignup",
  async (req: Request, res: Response) => {
    const deviceInfo = req.headers[`user-agent`];

    console.log(deviceInfo);

    // 토큰을 발급받으려면 query string으로 넘겨야 할 정보들
    const code = req.query.code;
    const state = req.query.state;

    const extra = state.toString().split("_");
    const ip = extra[0];
    const location = extra[1];

    const naver_client_id = process.env.NAVER_CLIENT_ID;
    const naver_client_secret = process.env.NAVER_CLIENT_SECRET;
    const naver_redirect_url = "https://openapi.naver.com/v1/nid/me";

    // token 받기
    const naver_api_url = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&response_type=code&client_id=${naver_client_id}&client_secret=${naver_client_secret}&redirect_uri=${naver_redirect_url}&code=${code}&state=${state}`;
    const tokens = await fetch(naver_api_url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Naver-Client-Id": naver_client_id,
        "X-Naver-Client-Secret": naver_client_secret,
      },
    });

    const data = await tokens.json();

    const token = data.access_token;

    // 토큰을 이용해 유저 정보 받기
    const response = await fetch(naver_redirect_url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const naverUserData = await response.json();

    const {
      id,
      nickname,
      profile_image,
      gender,
      email,
      name,
      birthday,
      birthyear,
    } = naverUserData.response;

    // 같은 이메일을 사용하는 유저가 있는지 확인
    const duplicatedEmail = await getUserByEmail(email);

    if (duplicatedEmail) {
      throw new DuplicateError("이메일 중복");
    }

    // naver아이디를 이용해 임의의 아이디 만들기
    const userId = id
      .split("-")
      .join("")
      .split("_")
      .join("")
      .toLowerCase()
      .slice(0, 29);

    const duplicatedUserId = await getUserByUserId(userId);

    if (duplicatedUserId) {
      throw new DuplicateError("중복 아이디");
    }

    const hashedPassword = generatePassword();

    const isAuthenticated = true;
    const social = "naver";
    const birth = birthyear + birthday.split("-").join("");
    const genderLowcase = gender.toLowerCase();

    const user = await saveUser(
      nickname,
      email,
      birth,
      hashedPassword,
      userId,
      profile_image,
      genderLowcase,
      location,
      ip,
      isAuthenticated,
      social
    );

    if (!user) {
      throw new BadRequest("회원 가입 실패");
    }

    // 토큰 생성
    // access token 생성
    const { accessToken, refreshToken } = createAccessAndRefreshTokens(
      user._id,
      user.userRole
    );

    // 로그인 정보를 기록
    // 장치 정보 알아내기
    const device: DeviceType = fetchDeviceInfo(deviceInfo);

    const loginInfo = {
      user: user._id,
      refreshToken,
      device,
      ip,
      location,
    };

    // 동일 유저, ip, 장치를 사용한 로그인 여부 확인
    const isSavedInfo = await checkSameDeviceTypeAndUserAndIP(
      user._id,
      ip,
      device
    );

    // 이미 기록된 로그인이 아닌 경우에만 저장
    if (!isSavedInfo) {
      const info = await saveLoginInfo(loginInfo);

      if (!info) {
        throw new BadRequest("로그인 정보 등록 실패");
      }
    }

    // 쿠키 전송
    res.cookie("access", accessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.redirect(`http://localhost:5173/auth?naver=success&userId=${userId}`);
  }
);

// 네이버 회원 가입시 설정 저장하기
const saveNaverSettings = asyncWrapper(
  "saveNaverSettings",
  async (req: Request, res: Response) => {
    const { alarms, language, darkMode, userId } = req.body;

    console.log(alarms, language, darkMode, userId);

    const settings = await saveUserSettings(userId, alarms, language);

    if (!settings) {
      throw new BadRequest("설정 저장 실패");
    }

    res.status(201).json({ message: "설정 저장 성공", success: "ok" });
  }
);

// 카카오로 회원 가입
const kakaoSignup = asyncWrapper(
  "kakaoSignup",
  async (req: Request, res: Response) => {
    const deviceInfo = req.headers[`user-agent`];

    const CLIENT_ID = process.env.KAKAO_REST_API_KEY;
    const REDIRECT_URI = process.env.KAKAO_REDIRECT_URL;
    const CODE = req.query.code as string;

    // 토큰 발급
    const kakao_token_url = `https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=${CLIENT_ID}&redirectUri=${REDIRECT_URI}&code=${CODE}`;

    const response = await fetch(kakao_token_url, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    const data = await response.json();

    const token = data.access_token;

    // 사용자 정보 가져오기
    const kakao_user_url = `https://kapi.kakao.com/v2/user/me`;
    const userInfo = await fetch(kakao_user_url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const receivedUserInfo = await userInfo.json();

    console.log(
      receivedUserInfo.properties,
      receivedUserInfo.kakao_account.email
    );

    if (!receivedUserInfo) {
      return res
        .status(404)
        .json({ message: "비회원", success: "unauthorized" });
    }

    const username = receivedUserInfo.properties.nickname;
    const userPic = receivedUserInfo.properties.profile_image;
    const email = receivedUserInfo.kakao_account.email;

    const user = await getUserByEmail(email);

    if (user) {
      const newSocial = [...user.social, "kakako"];
      const socialUpdate = await updateSocial(email, newSocial);

      if (socialUpdate.modifiedCount === 0) {
        throw new BadRequest("회원 가입 실패");
      }

      return res.redirect("http://localhost:5173/auth");
    } else {
      console.log("회원가입 성공");

      return res.redirect(
        `http://localhost:5173/auth?username=${username}&userPic=${userPic}&email=${email}&kakao=success`
      );
    }
  }
);

// 일반 로그인
const normalLogin = asyncWrapper(
  "normalLogin",
  async (req: Request, res: Response) => {
    const { userId, email, password, ip, location } = req.body;
    const deviceInfo = req.headers["user-agent"];

    console.log(userId, email, password, ip, location);

    if ((!userId && !email) || !password) {
      throw new BadRequest(
        "사용자 아이디 혹은 이메일 혹은 비밀번호를 제공해주세요."
      );
    }

    // 가입 여부 확인 하기
    let user;
    if (userId) {
      user = await getUserByUserId(userId);
    } else if (email) {
      user = await getUserByEmail(email);
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "가입자가 없습니다.", success: "unregistered" });
    }

    // 가입자의 인증 여부 확인하기
    if (!user.isAuthenticated) {
      return res
        .status(403)
        .json({ message: "미인증 가입자", success: "unautenticated" });
      return;
    }

    // 비밀번호 비교하기
    const isValidPassword = await checkPassword(user.password, password);
    if (!isValidPassword) {
      return res
        .status(400)
        .json({ message: "비밀번호 불일치", success: "wrongpassword" });
    }

    const { type, os, browser } = fetchDeviceInfo(deviceInfo);

    // access token, refresh token 생성하기
    // access token 생성
    const accessToken = createToken(user._id, user.userRole, "60m");
    // refresh token 생성
    const refreshToken = createToken(user._id, "", "1d");

    // 저장할 loginInfo
    const device: DeviceType = {
      type,
      os,
      browser,
    };

    const loginInfo = {
      user: user._id,
      refreshToken,
      device,
      ip,
      location,
    };

    // 동일 유저, ip, 장치를 사용한 로그인 여부 확인
    const isSavedInfo = await checkSameDeviceTypeAndUserAndIP(
      user._id,
      ip,
      device
    );

    // 이미 기록된 로그인이 아닌 경우에만 저장
    if (!isSavedInfo) {
      const info = await saveLoginInfo(loginInfo);

      if (!info) {
        throw new BadRequest("로그인 정보 등록 실패");
      }
    }

    res.cookie("access", accessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000, // 1시간
      sameSite: "lax",
    });
    res.json({ message: "로그인 성공", success: "ok" });
  } // normalLogin ends
); // asyncWrapper ends

const googleLoginCallback = asyncWrapper(
  "googleLoginCallback",
  async (req: Request, res: Response) => {
    const state = req.query.state;

    const ip = state.toString().split("_")[0];
    const location = state.toString().split("_")[1];

    const code = req.query.code;
    const deviceInfo = req.headers["user-agent"];

    // 토큰 발급하기
    const url = `https://oauth2.googleapis.com/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URL,
      code: code as string, // TypeScript에서는 코드 타입을 문자열로 지정
    });

    const response = await fetch(url, {
      method: "POST", // POST 메서드로 요청
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // 올바른 Content-Type
      },
      body: body.toString(), // 바디를 적절한 포맷으로 변환
    });

    if (!response.ok) {
      console.log("에러:", response.statusText);
      throw new CustomAPIError("토큰 획득 실패");
    }

    // 응답을 JSON 형식으로 변환
    const data = await response.json();

    const ACCESS_TOKEN = data.access_token;

    const requestUrl = `https://www.googleapis.com/userinfo/v2/me`;
    // 사용자 정보 취득하기
    const resData = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (!resData.ok) {
      console.log("에러:", resData.statusText);
      throw new CustomAPIError("회원 정보 획득 실패");
    }

    const userInfo = await resData.json();

    const email = userInfo.email;

    const user = await getUserByEmail(email);

    if (user) {
      const isRegistered = user.social.includes("google");

      if (!isRegistered) {
        const newSocial = [...user.social, "google"];
        await updateSocial(email, newSocial);
      }

      const { accessToken, refreshToken } = createAccessAndRefreshTokens(
        user._id,
        user.userRole
      );

      const device = fetchDeviceInfo(deviceInfo);

      const loginInfo = {
        user: user._id,
        refreshToken,
        device,
        ip,
        location,
      };

      // 동일 유저, ip, 장치를 사용한 로그인 여부 확인
      const isSavedInfo = await checkSameDeviceTypeAndUserAndIP(
        user._id,
        ip,
        device
      );

      // 이미 기록된 로그인이 아닌 경우에만 저장
      if (!isSavedInfo) {
        const info = await saveLoginInfo(loginInfo);

        if (!info) {
          throw new BadRequest("로그인 정보 등록 실패");
        }
      }

      res.cookie("access", accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // 1시간
        sameSite: "lax",
      });

      return res.redirect("http://localhost:5173");
    } else {
      return res
        .status(404)
        .json({ message: "비가입자", success: "unauthorized" });
    }
  }
);

export {
  sendAuthCodeEmail,
  checkExistingEmail,
  checkExistingUserId,
  creatNewUser,
  verifyAuthCode,
  normalLogin,
  integrateSocial,
  googleSignup,
  naverSignup,
  naverRequest,
  saveNaverSettings,
  kakaoSignup,
  googleLoginCallback,
};
