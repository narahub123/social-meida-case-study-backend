import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // 유저 이름
    username: {
      type: String,
      minLength: 1,
      maxLength: [30, "사용자 이름은 최대 30자까지 입력할 수 있습니다."],
      required: true,
      match: /^.{1,30}$/,
    },

    // 이메일
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "유효하지 않은 이메일 형식입니다."], // 이메일 유효성 검사
    },

    // 생년월일
    birth: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{8}$/, // YYYYMMDD 형식의 생년월일
    },

    // 성별
    gender: {
      type: String,
      required: true,
      enum: ["m", "f"], // 성별 값: 남성(m) 또는 여성(f)
    },

    // 비밀번호
    password: {
      type: String,
      required: true,
    },

    // 사용자 ID
    userId: {
      type: String,
      required: true,
      unique: true,
      minLength: [4, "사용자 ID는 최소 4자 이상이어야 합니다."],
      maxLength: [30, "사용자 ID는 최대 30자까지 입력할 수 있습니다."],
      match: /^[a-z0-9_]{4,30}$/, // 소문자, 숫자 및 밑줄(_)만 허용
      lowercase: true,
    },

    // 사용자 등급
    userRole: {
      type: String,
      enum: {
        values: ["ADMIN", "USER"],
        message: `{VALUE}는 지원되지 않는 사용자 등급입니다.`,
      },
      default: "USER", // 기본값은 "USER"
      uppercase: true,
    },

    // 가입시 IP 주소
    ip: {
      type: String,
      required: true,
      match: [
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        "유효하지 않은 IP 주소 형식입니다.",
      ], // IP 주소 유효성 검사
    },

    // 가입시 주소
    location: {
      type: String,
      required: true,
    },

    // 프로필 사진
    userPic: {
      type: String,
      default: "",
    },

    // 프로필 설명
    userIntro: {
      type: String,
      default: "",
      maxLength: [150, "프로필 설명은 최대 150자까지 입력할 수 있습니다."],
    },

    // 팔로잉 목록
    following: {
      type: [String],
      ref: "User",
      default: [],
    },

    // 팔로워 목록
    followers: {
      type: [String],
      ref: "User",
      default: [],
    },

    // 인증 코드 인증 여부
    isAuthenticated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User = mongoose.model("User", UserSchema);
