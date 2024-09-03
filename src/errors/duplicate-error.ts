import CustomAPIError from "./custom-error";

class DuplicateError extends CustomAPIError {
  constructor(message: string) {
    super(message);
    this.statusCode = 409;
  }
}

export default DuplicateError;
