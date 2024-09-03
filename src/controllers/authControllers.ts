import express from "express";
import { sendEmail } from "../services/emailServices";

// 인증 코드 보내기
const sendAuthCodeEmail = async (
  req: express.Request,
  res: express.Response
) => {
  const { username, email, birth } = req.body;

  try {
    // 인증 코드 생성 : 6자리 숫자 문자열 
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();

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

export { sendAuthCodeEmail };
