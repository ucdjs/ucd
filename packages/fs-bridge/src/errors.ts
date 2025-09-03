import type { FileSystemBridgeCapabilityKey } from "./types";

export abstract class BridgeBaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "BridgeBaseError";
  }
}

export class BridgeGenericError extends BridgeBaseError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message, {
      cause: originalError,
    });
    this.name = "BridgeGenericError";
    this.originalError = originalError;
  }
}

export class BridgeSetupError extends BridgeBaseError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message, {
      cause: originalError,
    });
    this.name = "BridgeSetupError";
    this.originalError = originalError;
  }
}

export class BridgeUnsupportedOperation extends BridgeBaseError {
  public readonly capability: FileSystemBridgeCapabilityKey;

  constructor(
    capability: FileSystemBridgeCapabilityKey,
  ) {
    super(`File system bridge does not support the '${capability}' capability.`);
    this.name = "BridgeUnsupportedOperation";
    this.capability = capability;
  }
}

export class BridgePathTraversal extends BridgeBaseError {
  public readonly accessedPath: string;
  public readonly basePath: string;

  constructor(basePath: string, accessedPath: string) {
    super(`Path traversal detected: attempted to access '${accessedPath}' which is outside the allowed base path '${basePath}'`);
    this.name = "BridgePathTraversal";
    this.basePath = basePath;
    this.accessedPath = accessedPath;
  }
}

export class BridgeWindowsDriveDifference extends BridgeBaseError {
  public readonly accessedDrive: string;
  public readonly baseDrive: string;

  constructor(baseDrive: string, accessedDrive: string) {
    super(`Drive letter mismatch detected: attempted to access '${accessedDrive}' which is on a different drive than the allowed base drive '${baseDrive}'`);
    this.name = "BridgeWindowsDriveDifference";
    this.baseDrive = baseDrive;
    this.accessedDrive = accessedDrive;
  }
}

export class BridgeFileNotFound extends BridgeBaseError {
  public readonly path: string;

  constructor(path: string) {
    super(`File or directory not found: ${path}`);
    this.name = "BridgeFileNotFound";
    this.path = path;
  }
}

export class BridgeEntryIsDir extends BridgeBaseError {
  public readonly path: string;

  constructor(path: string) {
    super(`Expected file but found directory: ${path}`);
    this.name = "BridgeEntryIsDir";
    this.path = path;
  }
}
