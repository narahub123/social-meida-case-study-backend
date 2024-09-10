export interface UserType {
  username: string;
  email: string;
  birth: string; // YYYYMMDD 형식의 생년월일
  gender: "m" | "f" | "b" | "h"; // 성별
  password: string;
  userId: string;
  userRole: "ADMIN" | "USER"; // 사용자 등급
  ip: string; // IP 주소
  location: string;
  userPic: string;
  userIntro: string;
  following: string[]; // 팔로잉 목록
  followers: string[]; // 팔로워 목록
  isAuthenticated: boolean;
  social?: string[]; // 소셜 계정
}
