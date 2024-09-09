import mongoose from "mongoose";

export interface LoginType {
  user: mongoose.Types.ObjectId;
  refreshToken: string;
  device: DeviceType;
  ip: string;
  location: string;
}

export interface DeviceType {
  type: string;
  os: string;
  browser: string;
}
