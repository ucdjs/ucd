import type { ApiError } from "./components";

export class ApiResponseError extends Error implements ApiError {
  public readonly path: string;
  public readonly status: number;
  public readonly timestamp: string;

  constructor(data: ApiError) {
    super(data.message);
    this.name = "ApiResponseError";
    this.path = data.path;
    this.status = data.status;
    this.timestamp = data.timestamp;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiResponseError);
    }
  }

  static fromResponse(response: Response, data: ApiError): ApiResponseError {
    return new ApiResponseError(data);
  }

  static fromApiError(error: ApiError): ApiResponseError {
    return new ApiResponseError({
      path: error.path,
      message: error.message,
      status: error.status,
      timestamp: error.timestamp,
    });
  }

  toJSON(): ApiError {
    return {
      path: this.path,
      message: this.message,
      status: this.status,
      timestamp: this.timestamp,
    };
  }
}
