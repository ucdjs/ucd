export abstract class PathUtilsBaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PathUtilsBaseError";
  }
}

export class MaximumDecodingIterationsExceededError extends PathUtilsBaseError {
  constructor() {
    super("Maximum decoding iterations exceeded - possible malicious input");
    this.name = "MaximumDecodingIterationsExceededError";
  }
}
