import { UserType } from "../user.type";

declare global {
  namespace Express {
    interface Request {
      user?: UserType;
    }
  }
}
