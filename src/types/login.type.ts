import mongoose from "mongoose";

export interface LoginType {
  user: mongoose.Types.ObjectId;
  refreshToken: string;
  device: {
    type: string;
    os: string;
    browser: string;
  };
  ip: string;
  location: string;
}
