import express from "express";
import { sendEmail } from "../services/emailServices";
import {
  getUserByEmail,
  getUserByUserId,
  saveUser,
} from "../services/userServices";
import { BadRequest, CustomAPIError, DuplicateError } from "../errors";
import { createAuthCode, createHashedPassword } from "../utils/auth";
import { saveImageToCloudinary } from "../utils/cloudinary";

// 인증 코드 보내기
const sendAuthCodeEmail = async (
  req: express.Request,
  res: express.Response
) => {
  const { email } = req.body;

  try {
    // 인증 코드 생성 : 6자리 숫자 문자열
    const authCode = createAuthCode();

    const subject = "인증코드";
    const html = `<p>인증코드 ${authCode}</p>`;

    let info = await sendEmail(email, subject, html);

    if (!info) {
      return res.status(400).json({ error: "이메일 전송 에러" });
    }

    // 이메일 정보를 db에 저장할 때 createAt를 이용해서 expiredAt을 생성하고 저장함

    // 리턴 값에 인증 코드와 종료 시간을 같이 전송함?
    res.status(200).json({ data: { authCode } });
  } catch (error) {
    console.log(error);
  }
};

// 이메일 중복확인
const checkExistingEmail = async (
  req: express.Request,
  res: express.Response
) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequest("이메일을 제공해주세요.");
  }

  try {
    const existingEmail = await getUserByEmail(email);

    if (existingEmail) {
      throw new DuplicateError("이미 존재하는 이메일입니다.");
    }

    res.status(200).json({ message: "사용 가능한 이메일입니다." });
  } catch (error) {
    console.log("Error in checkExistingEmail", error.message);
    throw new CustomAPIError("내부 에러");
  }
};

// 아이디 중복 체크
const checkExistingUserId = async (
  req: express.Request,
  res: express.Response
) => {
  const { userId } = req.body;
  if (!userId) {
    throw new BadRequest("userId를 제공해주세요.");
  }

  try {
    const existingUserId = await getUserByUserId(userId);

    if (existingUserId) {
      throw new DuplicateError("이미 존재하는 아이디입니다.");
    }

    res.status(200).json({ message: "사용 가능한 아이디입니다." });
  } catch (error) {
    console.log("Error in checkExistingUserId", error.message);
    throw new CustomAPIError("내부 에러");
  }
};

const creatNewUser = async (req: express.Request, res: express.Response) => {
  const { username, email, birth, password, userId, imgUrl, alarms, language } =
    req.body;

  // body로부터 받은 데이터가 다 있는지 확인
  // imgUrl은 선택사항이기 때문에 제외
  if (
    !username ||
    !email ||
    !birth ||
    !password ||
    !userId ||
    !alarms ||
    !language
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
    if (!alarms) {
      missingsArr.push("alarms");
    }
    if (!language) {
      missingsArr.push("language");
    }

    const missings = missingsArr.join(", ");

    throw new BadRequest(`${missings}에 대한 정보를 제공해주세요.`);
  }

  // console.log(
  //   username,
  //   email,
  //   birth,
  //   password,
  //   userId,
  //   imgUrl,
  //   alarms,
  //   language
  // );

  try {
    // 비밀번호 해싱
    const hashedPassword = await createHashedPassword(password);

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
      userPic
    );

    if (!user) {
      throw new BadRequest(`회원 가입 실패`);
    }

    // 이메일 전송
    // 인증 번호 생성하기
    const authCode = createAuthCode();
    // 제목
    const subject = "PlayGround 인증코드";
    // 내용
    const html = `<p>PlayGround 인증코드 : ${authCode}</p>`;
    const info = await sendEmail(email, subject, html);
    console.log(info);
    if (!info) {
      throw new BadRequest(`이메일 전송 실패`);
    }

    res.status(201).json({ message: "회원 가입 성공" });
  } catch (error) {
    console.log("Error in cretedUser", error.message);

    throw new CustomAPIError("내부 에러");
  }
};
export {
  sendAuthCodeEmail,
  checkExistingEmail,
  checkExistingUserId,
  creatNewUser,
};
