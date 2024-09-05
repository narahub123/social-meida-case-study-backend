import mongoose from "mongoose";

const AuthSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    authCode: {
      type: String,
      match: /^[0-9]{6}$/,
      required: true,
    },
    authExpiredAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// createdAt의 10분 뒤에 인증 코드가 만료됨
AuthSchema.pre("save", function (next) {
  if (!this.authExpiredAt) {
    this.authExpiredAt = new Date(this.createdAt.getTime() + 10 * 60000); // 10분
  }

  next();
});

// TTL : 만료시간 이후에 자동으로 해당 문서가 삭제됨  주의 : 분단위로 체크하기 때문에 정확하지는 않음
AuthSchema.index({ authExpiredAt: 1 }, { expireAfterSeconds: 0 });

export const Auth = mongoose.model("Auth", AuthSchema);
