import CustomAPIError from "./custom-error";

class ServerUnavailable extends CustomAPIError {
  constructor(message: string) {
    super(message, 503, "server unavailable");
  }
}

export default ServerUnavailable;
