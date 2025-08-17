/* eslint-disable ts/explicit-function-return-type */
export type StoreError
  = | {
    message: string;
    type: "UNSUPPORTED_VERSION";
    version: string;
  }
  | {
    message: string;
    type: "BRIDGE_UNSUPPORTED_OPERATION";
    operation: string;
  }
  | {
    message: string;
    type: "FILE_NOT_FOUND";
    filePath: string;
    version?: string;
  }
  | {
    message: string;
    type: "INVALID_MANIFEST";
    manifestPath: string;
  }
  | {
    message: string;
    type: "NOT_INITIALIZED";
  }
  | {
    message: string;
    type: "GENERIC";
    data?: Record<string, unknown>;
  };

abstract class BaseUCDStoreError<T extends StoreError> extends Error {
  abstract "~toStoreError"(): T;
}

export class UCDStoreError extends BaseUCDStoreError<{
  message: string;
  type: "GENERIC";
  data?: Record<string, unknown>;
}> {
  private readonly data?: Record<string, unknown>;

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

export class UCDStoreFileNotFoundError extends BaseUCDStoreError<{
  message: string;
  type: "FILE_NOT_FOUND";
  filePath: string;
  version?: string;
}> {
  private readonly filePath: string;
  private readonly version?: string;

  constructor(
    filePath: string,
    version?: string,
  ) {
    super(`File not found: ${filePath}${version ? ` in version ${version}` : ""}`);
    this.name = "UCDStoreFileNotFoundError";
    this.filePath = filePath;
    this.version = version;
  }

  "~toStoreError"() {
    return {
      type: "FILE_NOT_FOUND" as const,
      filePath: this.filePath,
      message: this.message,
      ...(this.version && { version: this.version }),
    };
  }
}

export class UCDStoreVersionNotFoundError extends BaseUCDStoreError<{
  message: string;
  type: "UNSUPPORTED_VERSION";
  version: string;
}> {
  private readonly version: string;

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

export class UCDStoreBridgeUnsupportedOperation extends BaseUCDStoreError<{
  message: string;
  type: "BRIDGE_UNSUPPORTED_OPERATION";
  operation: string;
}> {
  private readonly feature: string;
  private readonly requiredCapabilities: string[];
  private readonly availableCapabilities: string[];

  constructor(
    feature: string,
    requiredCapabilities: string[],
    availableCapabilities: string[],
  ) {
    super(`Feature "${feature}" is not supported. Required capabilities: ${requiredCapabilities.join(", ")}. Available capabilities: ${availableCapabilities.join(", ")}`);
    this.name = "UCDStoreUnsupportedFeature";
    this.feature = feature;
    this.requiredCapabilities = requiredCapabilities;
    this.availableCapabilities = availableCapabilities;
  }

  "~toStoreError"() {
    return {
      type: "BRIDGE_UNSUPPORTED_OPERATION" as const,
      operation: this.feature,
      message: this.message,
    };
  }
}

export class UCDStoreInvalidManifestError extends BaseUCDStoreError<{
  message: string;
  type: "INVALID_MANIFEST";
  manifestPath: string;
}> {
  private readonly manifestPath: string;

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

export class UCDStoreNotInitializedError extends BaseUCDStoreError<{
  message: string;
  type: "NOT_INITIALIZED";
}> {
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
