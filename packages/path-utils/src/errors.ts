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

export class WindowsPathBehaviorNotImplementedError extends PathUtilsBaseError {
  constructor() {
    super("Windows path behavior not implemented");
    this.name = "WindowsPathBehaviorNotImplementedError";
  }
}

export class UNCPathNotSupportedError extends PathUtilsBaseError {
  public readonly path: string;

  constructor(path: string) {
    super(`UNC paths are not supported: '${path}'`);
    this.name = "UNCPathNotSupportedError";
    this.path = path;
  }
}
