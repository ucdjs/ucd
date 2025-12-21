/**
 * Base error class for lockfile-related errors
 */
export class LockfileBaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LockfileBaseError";
    Object.setPrototypeOf(this, LockfileBaseError.prototype);
  }
}

/**
 * Error thrown when a lockfile or snapshot is invalid or cannot be read
 */
export class LockfileInvalidError extends LockfileBaseError {
  public readonly lockfilePath: string;
  public readonly details: string[];

  constructor({
    lockfilePath,
    message,
    details,
  }: {
    lockfilePath: string;
    message: string;
    details?: string[];
  }) {
    super(`invalid lockfile at ${lockfilePath}: ${message}`);
    this.name = "LockfileInvalidError";
    this.lockfilePath = lockfilePath;
    this.details = details || [];
    Object.setPrototypeOf(this, LockfileInvalidError.prototype);
  }
}

/**
 * Error thrown when a filesystem bridge operation is not supported
 */
export class LockfileBridgeUnsupportedOperation extends LockfileBaseError {
  public readonly operation: string;
  public readonly requiredCapabilities: string[];
  public readonly availableCapabilities: string[];

  constructor(operation: string, requiredCapabilities: string[], availableCapabilities: string[]) {
    let message = `Operation "${operation}" is not supported.`;

    if (requiredCapabilities.length > 0 || availableCapabilities.length > 0) {
      message += ` Required capabilities: ${requiredCapabilities.join(", ")}. Available capabilities: ${availableCapabilities.join(", ")}`;
    }

    super(message);
    this.name = "LockfileBridgeUnsupportedOperation";
    this.operation = operation;
    this.requiredCapabilities = requiredCapabilities;
    this.availableCapabilities = availableCapabilities;
    Object.setPrototypeOf(this, LockfileBridgeUnsupportedOperation.prototype);
  }
}

