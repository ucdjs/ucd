import type { FileSystemBackendFeature } from "./types";

export abstract class BackendError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "BackendError";
  }
}

export class BackendSetupError extends BackendError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message, {
      cause: originalError,
    });
    this.name = "BackendSetupError";
    this.originalError = originalError;
  }
}

export class BackendUnsupportedOperation extends BackendError {
  public readonly feature: FileSystemBackendFeature;

  constructor(feature: FileSystemBackendFeature) {
    super(`File system backend does not support the '${feature}' feature.`);
    this.name = "BackendUnsupportedOperation";
    this.feature = feature;
  }
}

export class BackendFileNotFound extends BackendError {
  public readonly path: string;

  constructor(path: string) {
    super(`File or directory not found: ${path}`);
    this.name = "BackendFileNotFound";
    this.path = path;
  }
}

export class BackendEntryIsDirectory extends BackendError {
  public readonly path: string;

  constructor(path: string) {
    super(`Expected file but found directory: ${path}`);
    this.name = "BackendEntryIsDirectory";
    this.path = path;
  }
}

export class BackendEntryIsFile extends BackendError {
  public readonly path: string;

  constructor(path: string) {
    super(`Expected directory but found file: ${path}`);
    this.name = "BackendEntryIsFile";
    this.path = path;
  }
}

export class CopyDestinationAlreadyExistsError extends BackendError {
  public readonly path: string;

  constructor(path: string) {
    super(`Copy destination already exists: ${path}`);
    this.name = "CopyDestinationAlreadyExistsError";
    this.path = path;
  }
}
