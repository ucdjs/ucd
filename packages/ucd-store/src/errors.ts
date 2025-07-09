export class UCDStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UCDStoreError";
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
    super(
      `Feature '${feature}' is not supported. `
      + `Required: [${requiredCapabilities.join(", ")}]. `
      + `Available: [${availableCapabilities.join(", ")}]`,
    );
    this.name = "UCDStoreUnsupportedFeature";
    this.feature = feature;
    this.requiredCapabilities = requiredCapabilities;
    this.availableCapabilities = availableCapabilities;
  }
}
