/* eslint-disable ts/explicit-function-return-type */

export abstract class UCDStoreBaseError extends Error {
  abstract "~toStoreError"(): any;
}

export class UCDStoreError extends UCDStoreBaseError {
  private data?: Record<string, unknown>;

  constructor(message: string, data?: Record<string, unknown>) {
    super(message);
    this.name = "UCDStoreError";
    this.data = data;
  }

  "~toStoreError"() {
    return {
      type: "GENERIC" as const,
      message: this.message,
      ...(this.data && { data: this.data }),
    };
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

  "~toStoreError"() {
    return {
      type: "FILE_NOT_FOUND" as const,
      message: this.message,
      filePath: this.filePath,
      ...(this.version && { version: this.version }),
    };
  }
}

export class UCDStoreVersionNotFoundError extends UCDStoreBaseError {
  public readonly version: string;

  constructor(version: string) {
    super(`Version '${version}' does not exist in the store.`);
    this.name = "UCDStoreVersionNotFoundError";
    this.version = version;
  }

  "~toStoreError"() {
    return {
      type: "UNSUPPORTED_VERSION" as const,
      version: this.version,
      message: this.message,
    };
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

  "~toStoreError"() {
    return {
      type: "BRIDGE_UNSUPPORTED_OPERATION" as const,
      operation: this.operation,
      message: this.message,
      requiredCapabilities: this.requiredCapabilities,
      availableCapabilities: this.availableCapabilities,
    };
  }
}

export class UCDStoreInvalidManifestError extends UCDStoreBaseError {
  private manifestPath: string;

  constructor(manifestPath: string, message: string) {
    super(`invalid manifest at ${manifestPath}: ${message}`);
    this.name = "UCDStoreInvalidManifestError";
    this.manifestPath = manifestPath;
  }

  "~toStoreError"() {
    return {
      type: "INVALID_MANIFEST" as const,
      manifestPath: this.manifestPath,
      message: this.message,
    };
  }
}

export class UCDStoreNotInitializedError extends UCDStoreBaseError {
  constructor() {
    super("Store is not initialized. Please initialize the store before performing operations.");
    this.name = "UCDStoreNotInitializedError";
  }

  "~toStoreError"() {
    return {
      type: "NOT_INITIALIZED" as const,
      message: this.message,
    };
  }
}

export type GenericError = ReturnType<UCDStoreError["~toStoreError"]>;
export type FileNotFoundError = ReturnType<UCDStoreFileNotFoundError["~toStoreError"]>;
export type UnsupportedVersionError = ReturnType<UCDStoreVersionNotFoundError["~toStoreError"]>;
export type BridgeUnsupportedOperationError = ReturnType<UCDStoreBridgeUnsupportedOperation["~toStoreError"]>;
export type InvalidManifestError = ReturnType<UCDStoreInvalidManifestError["~toStoreError"]>;
export type StoreNotInitializedError = ReturnType<UCDStoreNotInitializedError["~toStoreError"]>;

export type StoreError
  = | GenericError
    | FileNotFoundError
    | UnsupportedVersionError
    | BridgeUnsupportedOperationError
    | InvalidManifestError
    | StoreNotInitializedError;
