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
import { BadRequest, DuplicateError, NoContent, NotFound } from "../errors";
import {
  checkLoginInfo,
  checkPassword,
  createAccessToken,
  createAuthCode,
  createHashedPassword,
  createRefreshToken,
  createToken,
  fetchDeviceInfo,
  generatePassword,
  getUserInfoByOauth,
} from "../utils/auth.utils";
import { saveImageToCloudinary } from "../utils/cloudinary";
import { asyncWrapper } from "../middlewares/asyncWrapper";
import { fetchAuthByUserId, saveAuthCode } from "../services/auth.service";
import {
  checkSameDeviceTypeAndUserAndIP,
  saveLoginInfo,
} from "../services/login.service";
import { DeviceType } from "types/login.type";

const baseUrl = process.env.BASE_URL;

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
    // refresh token 생성
    const refreshToken = createRefreshToken(user._id, "1d");

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

    let info;
    // 이미 기록된 로그인이 아닌 경우에만 저장
    if (!isSavedInfo) {
      info = await saveLoginInfo(loginInfo);

      if (!info) {
        throw new BadRequest("로그인 정보 등록 실패");
      }
    }

    const accessToken = createAccessToken(
      info._id,
      user._id,
      user.userRole,
      "1h"
    );

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
    // refresh token 생성
    const refreshToken = createRefreshToken(user._id, "1d");

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

    let info;
    // 이미 기록된 로그인이 아닌 경우에만 저장
    if (!isSavedInfo) {
      info = await saveLoginInfo(loginInfo);

      if (!info) {
        throw new BadRequest("로그인 정보 등록 실패");
      }
    }

    // access token 생성
    const accessToken = createAccessToken(
      info._id,
      user._id,
      user.userRole,
      "1h"
    );
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

    // refresh token 생성
    const refreshToken = createRefreshToken(user._id, "1d");

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

    let info;
    // 이미 기록된 로그인이 아닌 경우에만 저장
    if (!isSavedInfo) {
      info = await saveLoginInfo(loginInfo);

      if (!info) {
        throw new BadRequest("로그인 정보 등록 실패");
      }
    }

    // access token 생성
    const accessToken = createAccessToken(
      info._id,
      user._id,
      user.userRole,
      "1h"
    );
    res.cookie("access", accessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000, // 1시간
      sameSite: "lax",
    });
    res.json({ message: "로그인 성공", success: "ok" });
  } // normalLogin ends
); // asyncWrapper ends

const oauthLogin = async (req: Request, res: Response) => {
  // 공통 정보
  const state = req.query.state.toString().split("_");

  const ip = state[0];
  const location = state[1];
  const type = state[2];
  const deviceInfo = req.headers["user-agent"];
  const device = fetchDeviceInfo(deviceInfo);

  const code = req.query.code as string;

  try {
    // oauth를 통해 유저 정보 얻기
    const userInfo = await getUserInfoByOauth(
      type,
      code,
      req.query.state.toString()
    );

    // 유저의 이메일 정보
    const email =
      type === "google"
        ? userInfo.email
        : type === "kakao"
        ? userInfo.kakao_account.email
        : type === "naver"
        ? userInfo.response.email
        : "";

    // 해당 email를 등록한 유저 찾기
    const user = await getUserByEmail(email);

    // 해당 email를 등록한 유저가 있는 경우
    if (user) {
      // 소셜이 등록되어 있는지 확인
      const isRegistered = user.social.includes(type);

      // 등록되어 있지 않다면
      if (!isRegistered) {
        const newSocial = [...user.social, type];
        // 소셜 추가하기
        const updatedSocial = await updateSocial(email, newSocial);

        if (updatedSocial.matchedCount === 0) {
          throw new NotFound("소셜 추가 실패 : 해당 유저를 찾을 수 없음");
        }
        if (updatedSocial.modifiedCount === 0) {
          throw new NoContent(
            "소셜 추가 실패: 해당 유저는 찾았지만 소셜이 추가되지 않음"
          );
        }
      }

      // refresh token 생성
      const refreshToken = createRefreshToken(user._id, "1d");

      // 등록할 로그인 정보
      const loginInfo = {
        user: user._id,
        refreshToken,
        device,
        ip,
        location,
      };

      // 로그인 정보 등록 여부 확인
      const info = await checkLoginInfo(loginInfo);

      console.log("정보", info);

      // access token 생성
      const accessToken = createAccessToken(
        info._id,
        user._id,
        user.userRole,
        "1h"
      );

      // 쿠키 전송
      res.cookie("access", accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // 1시간
        sameSite: "lax",
        secure: false,
      });

      return res.redirect(baseUrl);
    } else {
      // 이메일을 사용하는 유저가 없는 경우
      throw new NotFound("비가입자");
    }
  } catch (error) {
    console.log("oauthLogin에서 에러 발생", error.message);
    return res.redirect(
      `${baseUrl}/auth?error=${encodeURIComponent(error.statusText)}`
    );
  }
};

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
  oauthLogin,
};
