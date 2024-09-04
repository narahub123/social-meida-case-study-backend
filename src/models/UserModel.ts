import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // 유저 이름
    username: {
      type: String,
      minLength: 1,
      maxLength: [30, "too long for username. Must be at most 30."],
      required: true,
      match: /^.{1,30}$/,
    },

    // 이메일
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"], // 이메일 유효성 검사
    },

    // 생년월일
    birth: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{8}$/,
    },

    // 성별
    gender: {
      type: String,
      required: true,
      enum: ["m", "f"],
    },

    // 비밀번호
    password: {
      type: String,
      required: true,
    },

    // 주소
    userId: {
      type: String,
      required: true,
      unique: true,
      minLength: [4, "too short for userId. Must be at least 4."],
      maxLength: [30, "too long for userId. Must be at most 30."],
      match: /^[a-z0-9_]{4,30}$/,
      lowercase: true,
    },

    // 사용자 등급
    userRole: {
      type: String,
      enum: { values: ["ADMIN", "USER"], message: `{VALUE} is not supported` },
      default: "USER",
      uppercase: true,
    },
    // 가입시 IP address
    ip: {
      type: String,
      required: true,
      match: [
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        "Invalid IP address format",
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
      maxLength: [150, "too long for userIntro. Must be at most 150"],
    },

    // 팔로잉
    following: {
      type: [String],
      ref: "User",
      default: [],
    },

    // 팔로워
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

    // 인증 코드 만료 시간
    authExpiredAt: {
      type: Date,
      // 조건부 required : isAuthenticated가 false인 경우에는 필수 true인 경우에는 불필요
      required: function () {
        return this.isAuthenticated === false;
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// TTL 인덱스 설정(expiredAt 필드가 현재 시간보다 이전이면 문서 자체가 자동으로 삭제됨)
UserSchema.index({ authExpiredAt: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.model("User", UserSchema);
