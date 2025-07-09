import { describe, expect, it } from "vitest";
import { UCDStoreError, UCDStoreUnsupportedFeature } from "../../src/errors";

describe("error#UCDStoreError", () => {
  it("should create an instance with the correct message", () => {
    const message = "Test error message";
    const error = new UCDStoreError(message);

    expect(error.message).toBe(message);
  });

  it("should extend Error class", () => {
    const error = new UCDStoreError("Test message");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(UCDStoreError);
  });

  it("should have the correct name property", () => {
    const error = new UCDStoreError("Test message");

    expect(error.name).toBe("UCDStoreError");
  });

  it("should preserve stack trace", () => {
    const error = new UCDStoreError("Test message");

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("UCDStoreError");
  });
});

describe("error#UCDStoreUnsupportedFeature", () => {
  it("should create an instance with the correct properties", () => {
    const feature = "TestFeature";
    const requiredCapabilities = ["capability1", "capability2"];
    const availableCapabilities = ["capability1", "capability3"];
    const error = new UCDStoreUnsupportedFeature(
      feature,
      requiredCapabilities,
      availableCapabilities,
    );

    expect(error.feature).toBe(feature);
    expect(error.requiredCapabilities).toEqual(requiredCapabilities);
    expect(error.availableCapabilities).toEqual(availableCapabilities);
  });

  it("should extend UCDStoreError class", () => {
    const error = new UCDStoreUnsupportedFeature(
      "TestFeature",
      ["capability1"],
      ["capability1", "capability2"],
    );

    expect(error).toBeInstanceOf(UCDStoreError);
    expect(error).toBeInstanceOf(UCDStoreUnsupportedFeature);
  });

  it("should have the correct name property", () => {
    const error = new UCDStoreUnsupportedFeature(
      "TestFeature",
      ["capability1"],
      ["capability1", "capability2"],
    );

    expect(error.name).toBe("UCDStoreUnsupportedFeature");
  });
});
