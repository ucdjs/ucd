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

export class PathTraversalError extends PathUtilsBaseError {
  public readonly accessedPath: string;
  public readonly basePath: string;

  constructor(basePath: string, accessedPath: string) {
    super(`Path traversal detected: attempted to access '${accessedPath}' which is outside the allowed base path '${basePath}'`);
    this.name = "PathTraversalError";
    this.basePath = basePath;
    this.accessedPath = accessedPath;
  }
}

export class WindowsDriveMismatchError extends PathUtilsBaseError {
  public readonly accessedDrive: string;
  public readonly baseDrive: string;

  constructor(baseDrive: string, accessedDrive: string) {
    super(`Drive letter mismatch detected: attempted to access '${accessedDrive}' which is on a different drive than the allowed base drive '${baseDrive}'`);
    this.name = "WindowsDriveMismatchError";
    this.baseDrive = baseDrive;
    this.accessedDrive = accessedDrive;
  }
}

export class WindowsPathTypeMismatchError extends PathUtilsBaseError {
  public readonly basePathType: string;
  public readonly inputPathType: string;

  constructor(basePathType: string, inputPathType: string) {
    super(`Cannot combine ${inputPathType} path with ${basePathType} base path on Windows`);
    this.name = "WindowsPathTypeMismatchError";
    this.basePathType = basePathType;
    this.inputPathType = inputPathType;
  }
}

export class WindowsUNCShareMismatchError extends PathUtilsBaseError {
  public readonly baseShare: string;
  public readonly inputShare: string;

  constructor(baseShare: string, inputShare: string) {
    super(`Different UNC shares not allowed: base share '${baseShare}' differs from input share '${inputShare}'`);
    this.name = "WindowsUNCShareMismatchError";
    this.baseShare = baseShare;
    this.inputShare = inputShare;
  }
}

export class FailedToDecodePathError extends PathUtilsBaseError {
  constructor() {
    super("Failed to decode path");
    this.name = "FailedToDecodePathError";
  }
}

export class IllegalCharacterInPathError extends PathUtilsBaseError {
  constructor(character: string) {
    super(`Illegal character detected in path: '${character}'`);
    this.name = "IllegalCharacterInPathError";
  }
}
