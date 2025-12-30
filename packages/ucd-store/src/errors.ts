// Base error class for UCD Store
// All store errors extend this class, to make it easier
// to filter errors.

export abstract class UCDStoreBaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UCDStoreBaseError";
  }
}

export class UCDStoreGenericError extends UCDStoreBaseError {
  public readonly data?: Record<string, unknown>;

  constructor(message: string, data?: Record<string, unknown>) {
    super(message);
    this.name = "UCDStoreGenericError";
    this.data = data;
  }
}

export class UCDStoreFileNotFoundError extends UCDStoreBaseError {
  public readonly filePath: string;
  public readonly version?: string;

  constructor(filePath: string, version?: string) {
    super(`File not found: ${filePath}${version ? ` in version ${version}` : ""}`);
    this.name = "UCDStoreFileNotFoundError";
    this.filePath = filePath;
    this.version = version;
  }
}

export class UCDStoreVersionNotFoundError extends UCDStoreBaseError {
  public readonly version: string;

  constructor(version: string) {
    super(`Version '${version}' does not exist in the store.`);
    this.name = "UCDStoreVersionNotFoundError";
    this.version = version;
  }
}

export class UCDStoreBridgeUnsupportedOperation extends UCDStoreBaseError {
  public readonly operation: string;
  public readonly requiredCapabilities: string[];
  public readonly availableCapabilities: string[];

  constructor(operation: string, requiredCapabilities: string[], availableCapabilities: string[]) {
    let message = `Operation "${operation}" is not supported.`;

    if (requiredCapabilities.length > 0 || availableCapabilities.length > 0) {
      message += ` Required capabilities: ${requiredCapabilities.join(", ")}. Available capabilities: ${availableCapabilities.join(", ")}`;
    }

    super(message);
    this.name = "UCDStoreBridgeUnsupportedOperation";
    this.operation = operation;
    this.requiredCapabilities = requiredCapabilities;
    this.availableCapabilities = availableCapabilities;
  }
}

export class UCDStoreInvalidManifestError extends UCDStoreBaseError {
  public readonly manifestPath: string;
  public readonly details: string[];

  constructor({
    manifestPath,
    message,
    details,
  }: {
    manifestPath: string;
    message: string;
    details?: string[];
  }) {
    super(`invalid manifest at ${manifestPath}: ${message}`);
    this.name = "UCDStoreInvalidManifestError";
    this.manifestPath = manifestPath;
    this.details = details || [];
  }
}

export class UCDStoreNotInitializedError extends UCDStoreBaseError {
  constructor() {
    super("Store is not initialized. Please initialize the store before performing operations.");
    this.name = "UCDStoreNotInitializedError";
  }
}

export class UCDStoreFilterError extends UCDStoreBaseError {
  public readonly excludePattern: string[] = [];
  public readonly includePattern: string[] = [];
  public readonly filePath: string;

  constructor(message: string, {
    excludePattern,
    includePattern,
    filePath,
  }: {
    excludePattern: string[];
    includePattern: string[];
    filePath: string;
  }) {
    super(message);
    this.name = "UCDStoreFilterError";
    this.excludePattern = excludePattern;
    this.includePattern = includePattern;
    this.filePath = filePath;
  }
}

export class UCDStoreApiFallbackError extends UCDStoreBaseError {
  public readonly version: string;
  public readonly filePath: string;
  public readonly status?: number;
  public readonly reason: "fetch-failed" | "no-data";

  constructor({
    version,
    filePath,
    status,
    reason,
    message,
  }: {
    version: string;
    filePath: string;
    status?: number;
    reason: "fetch-failed" | "no-data";
    message?: string;
  }) {
    const defaultMessage = reason === "fetch-failed"
      ? `Failed to fetch file '${filePath}' from API${status ? ` (status: ${status})` : ""}`
      : `API returned no data for file '${filePath}'`;

    super(message ?? defaultMessage);
    this.name = "UCDStoreApiFallbackError";
    this.version = version;
    this.filePath = filePath;
    this.status = status;
    this.reason = reason;
  }
}

export type StoreError
  = | UCDStoreGenericError
    | UCDStoreFileNotFoundError
    | UCDStoreVersionNotFoundError
    | UCDStoreBridgeUnsupportedOperation
    | UCDStoreInvalidManifestError
    | UCDStoreNotInitializedError
    | UCDStoreApiFallbackError;
