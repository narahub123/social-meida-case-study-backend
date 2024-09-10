import CustomAPIError from "./custom-error";

class Unauthorized extends CustomAPIError {
  constructor(message: string) {
    super(message, 401, "unauthorizeds");
  }
}

export default Unauthorized;
