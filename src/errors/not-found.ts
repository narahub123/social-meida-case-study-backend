import CustomAPIError from "./custom-error";

class NotFound extends CustomAPIError {
  constructor(message: string) {
    super(message);
    this.statusCode = 404;
    this.statusText = "not found";
  }
}

export default NotFound;
