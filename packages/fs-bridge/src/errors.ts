import type { FileSystemBridgeCapabilityKey } from "./types";

export abstract class BridgeBaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BridgeBaseError";
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

export class BridgeGenericError extends BridgeBaseError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = "BridgeGenericError";
    this.originalError = originalError;
  }
}

export class BridgePathTraversal extends BridgeBaseError {
  public readonly path: string;

  constructor(path: string) {
    super(`Path traversal detected: attempted to access path outside of allowed scope: ${path}`);
    this.name = "BridgePathTraversal";
    this.path = path;
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
