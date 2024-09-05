import { UserSettings } from "../models/UserSettingsModel";
import { AlarmsTypes } from "../types/userSettings";

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
