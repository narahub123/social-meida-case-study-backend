import CustomAPIError from "./custom-error";

// 자료는 있지만 실제로 요청이 이루어지지 않은 경우 사용
class NoContent extends CustomAPIError {
  constructor(message: string) {
    super(message, 204, "no content");
  }
}

export default NoContent;
