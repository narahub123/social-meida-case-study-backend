import CustomAPIError from "./custom-error";

class BadRequest extends CustomAPIError {
  constructor(message: string) {
    super(message);
    this.statusCode = 400;
    this.statusText = "bad request";
  }
}

export default BadRequest;
