import CustomAPIError from "./custom-error";

class Forbidden extends CustomAPIError {
  constructor(message: string) {
    super(message, 403, "forbidden");
  }
}

export default Forbidden;
