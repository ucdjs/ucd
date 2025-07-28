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
    super(`Version not found: ${version}`);
    this.name = "UCDStoreVersionNotFoundError";
    this.version = version;
  }
}
