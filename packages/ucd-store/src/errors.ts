export class UCDStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UCDStoreError";
  }
}

export class UCDStoreFileNotFoundError extends UCDStoreError {
  public readonly filePath: string;
  public readonly version: string;

  constructor(filePath: string, version: string) {
    super(`File not found: ${filePath} in version ${version}`);
    this.name = "UCDStoreFileNotFoundError";
    this.filePath = filePath;
    this.version = version;
  }
}

export class UCDStoreVersionNotFoundError extends UCDStoreError {
  public readonly version: string;

  constructor(version: string) {
    super(`Version '${version}' does not exist in the store.`);
    this.name = "UCDStoreVersionNotFoundError";
    this.version = version;
  }
}

export class UCDStoreUnsupportedFeature extends UCDStoreError {
  public readonly feature: string;
  public readonly requiredCapabilities: string[];
  public readonly availableCapabilities: string[];

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
}

export class UCDStoreInvalidManifestError extends UCDStoreError {
  public readonly manifestPath: string;

  constructor(manifestPath: string, message: string) {
    super(`invalid manifest at ${manifestPath}: ${message}`);
    this.name = "UCDStoreInvalidManifestError";
    this.manifestPath = manifestPath;
  }
}

export class UCDStoreNotInitializedError extends UCDStoreError {
  constructor() {
    super("Store is not initialized. Please initialize the store before repairing.");
    this.name = "UCDStoreNotInitializedError";
  }
}
