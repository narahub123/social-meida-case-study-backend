import CustomAPIError from "./custom-error";

class DuplicateError extends CustomAPIError {
  constructor(message: string) {
    super(message, 409, "conflict");
  }
}

export default DuplicateError;
