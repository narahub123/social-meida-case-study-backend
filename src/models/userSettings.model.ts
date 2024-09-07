import mongoose from "mongoose";

// 알림 설정을 위한 서브 스키마
const AlarmSettingsSchema = new mongoose.Schema(
  {
    // 메시지가 왔을 때 알림
    message: { type: Boolean, default: false },
    // 댓글이 왔을 때 알림
    comment: { type: Boolean, default: false },
    // 팔로잉이 늘었을 때 알림
    following: { type: Boolean, default: false },
    // 팔로워 중 새로운 포스트가 있을 때 알림
    newPost: { type: Boolean, default: false },
  },
  { _id: false } // _id 필드 생성 막음
);

const UserSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
      unique: true,
    },
    // 밝은 화면 / 어두운 화면
    screenMode: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    // 알림 설정
    alarms: AlarmSettingsSchema,
    // 언어 설정
    language: {
      type: String,
      enum: ["Korean", "English"],
      default: "Korean",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserSettings = mongoose.model("UserSettings", UserSettingsSchema);
