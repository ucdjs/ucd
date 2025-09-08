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
