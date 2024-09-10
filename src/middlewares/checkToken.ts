import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getUserById } from "../services/user.service";
import { Forbidden, NotFound, Unauthorized } from "../errors";
import { fetchLoginInfoById } from "../services/login.service";
import { createAccessToken } from "../utils/auth.utils";
const secret = process.env.JWT_SECRET_KEY;

export const checkToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // access token 얻기
  const { access } = req.cookies;

  // access 토큰이 없는 경우
  // 로그인을 안한 사용자 로그인 안한 사용자를 어떻게 처리하느냐에 따라 코드가 달라짐
  if (!access) {
    next();
    // throw new Unauthorized("로그인 필요");
  }

  // access 토큰이 있는 경우
  // 토큰 확인하기
  try {
    const decoded = jwt.verify(access, secret) as JwtPayload;

    // 토큰이 유효한 경우
    const _id = decoded.user;

    // 유저 정보 가져오기
    const user = await getUserById(_id);

    if (!user) {
      throw new NotFound("해당 토큰을 사용하는 유저가 없음");
    }

    // request에 user 정보 담기
    req.user = user;

    next();
  } catch (err) {
    // 토큰이 유효하지 않은 경우
    // 유효 기간이 만료된 경우
    if (err.name === "TokenExpiredError") {
      // refresh토큰 확인
      const decoded = jwt.verify(access, secret) as JwtPayload;
      // 토큰이 유효한 경우
      const _id = decoded.user;

      // 유저 정보 가져오기
      const user = await getUserById(_id);

      if (!user) {
        throw new NotFound("해당 토큰을 사용하는 유저가 없음");
      }

      // refresh 유효 기간 확인 하기
      try {
        const loginId = decoded.login;

        // refresh 토큰 가져오기(로그인 기록)
        const loginInfo = await fetchLoginInfoById(loginId);

        // refresh token이 없는 경우(refresh 토큰이 만료된 경우) 로그인 필요
        if (!loginInfo.refreshToken) {
          throw new Forbidden("리프레시 토큰 만료");
        }

        const refreshToken = loginInfo.refreshToken as string;
        const decodedRefresh = jwt.verify(refreshToken, secret);

        // 유효한 경우 : access 생성
        const accessToken = createAccessToken(
          loginInfo._id,
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

        // request에 user 정보 담기
        req.user = user;

        next();

        // refresh 토큰이 유효하지 않은 경우 로그인 필요
      } catch (error) {
        throw new Forbidden("리프레시 토큰 만료");
      }

      // 유효하지 않은 access 토큰인 경우
    } else if (err.name === "JsonWebTokenError") {
      throw new Unauthorized("access 토큰 에러");
    }
  }
};
