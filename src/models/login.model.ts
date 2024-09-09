import mongoose from "mongoose";

const LoginSchema = new mongoose.Schema(
  {
    // user._id
    user: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },

    //리프레시 토큰
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },

    // 장치 정보
    device: {
      type: {
        type: String,
        required: true,
        enum: ["desktop", "tablet", "mobile"],
      },
      os: {
        type: String,
        required: true,
      },
      browser: {
        type: String,
        required: true,
      },
    },

    // ip 주소
    ip: {
      type: String,
      required: true,
    },

    // 로그인한 장소
    location: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Login = mongoose.model("Login", LoginSchema);
