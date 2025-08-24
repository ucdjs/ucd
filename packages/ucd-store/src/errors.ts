// Base error class for UCD Store
// All store errors extend this class, to make it easier
// to filter errors.
export abstract class UCDStoreBaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UCDStoreBaseError";
  }

  // prevents throwing this
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
  private manifestPath: string;

  constructor(manifestPath: string, message: string) {
    super(`invalid manifest at ${manifestPath}: ${message}`);
    this.name = "UCDStoreInvalidManifestError";
    this.manifestPath = manifestPath;
  }
}

export class UCDStoreNotInitializedError extends UCDStoreBaseError {
  constructor() {
    super("Store is not initialized. Please initialize the store before performing operations.");
    this.name = "UCDStoreNotInitializedError";
  }
}

export type StoreError
  = | UCDStoreGenericError
    | UCDStoreFileNotFoundError
    | UCDStoreVersionNotFoundError
    | UCDStoreBridgeUnsupportedOperation
    | UCDStoreInvalidManifestError
    | UCDStoreNotInitializedError;
