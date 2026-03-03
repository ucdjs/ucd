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
