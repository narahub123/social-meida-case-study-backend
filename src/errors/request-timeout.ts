import CustomAPIError from "./custom-error";

class RequestTimeout extends CustomAPIError {
  constructor(message: string) {
    super(message, 408, "request timeout");
  }
}

export default RequestTimeout;
