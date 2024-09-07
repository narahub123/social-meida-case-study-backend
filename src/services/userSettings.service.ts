import { UserSettings } from "../models/userSettings.model";
import { AlarmsTypes } from "../types/userSettings.type";

// 유저 설정 저장
const saveUserSettings = async (
  userId: string,
  alarms: AlarmsTypes,
  language: string
) => {
  try {
    const newUserSettings = new UserSettings({
      userId,
      alarms,
      language,
    });

    return newUserSettings.save();
  } catch (error) {
    throw error;
  }
};
export { saveUserSettings };
