/* eslint-disable test/prefer-lowercase-title */
import { describe, expect, it } from "vitest";
import {
  UCDStoreError,
  UCDStoreFileNotFoundError,
  UCDStoreUnsupportedFeature,
  UCDStoreVersionNotFoundError,
} from "../src/errors";

describe("custom errors", () => {
  describe("UCDStoreError", () => {
    it("should create an instance with the correct message", () => {
      const message = "Test error message";
      const error = new UCDStoreError(message);

      expect(error.message).toBe(message);
    });

    it("should extend Error class and have correct properties", () => {
      const error = new UCDStoreError("Test message");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UCDStoreError);
      expect(error.name).toBe("UCDStoreError");
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("UCDStoreError");
    });
  });

  describe("UCDStoreFileNotFoundError", () => {
    it("should create error with correct properties and inheritance", () => {
      const filePath = "/path/to/file.txt";
      const version = "1.0.0";
      const error = new UCDStoreFileNotFoundError(filePath, version);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UCDStoreError);
      expect(error).toBeInstanceOf(UCDStoreFileNotFoundError);
      expect(error.name).toBe("UCDStoreFileNotFoundError");
      expect(error.message).toBe(`File not found: ${filePath} in version ${version}`);
      expect(error.filePath).toBe(filePath);
      expect(error.version).toBe(version);
    });

    it.each([
      { filePath: "/data/unicode.txt", version: "15.0.0" },
      { filePath: "/blocks/basic-latin.txt", version: "14.0.0" },
      { filePath: "/derived/combining-class.txt", version: "13.0.0" },
      { filePath: "/path/with spaces/file-name.txt", version: "1.0.0" },
    ])("should create error with filePath %s and version %s", ({ filePath, version }) => {
      const error = new UCDStoreFileNotFoundError(filePath, version);
      expect(error.message).toBe(`File not found: ${filePath} in version ${version}`);
      expect(error.filePath).toBe(filePath);
      expect(error.version).toBe(version);
    });
  });

  describe("UCDStoreVersionNotFoundError", () => {
    it("should create error with correct properties and inheritance", () => {
      const version = "15.0.0";
      const error = new UCDStoreVersionNotFoundError(version);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UCDStoreError);
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error.name).toBe("UCDStoreVersionNotFoundError");
      expect(error.message).toBe(`Version not found: ${version}`);
      expect(error.version).toBe(version);
    });

    it.each([
      "15.0.0",
      "14.0.0",
      "1.0",
      "2.0.0",
      "3.0.0-beta",
      "4.0.0-alpha.1",
    ])("should format message correctly for version %s", (version) => {
      const error = new UCDStoreVersionNotFoundError(version);
      expect(error.message).toBe(`Version not found: ${version}`);
      expect(error.version).toBe(version);
    });
  });

  describe("UCDStoreUnsupportedFeature", () => {
    it("should create error with correct properties and inheritance", () => {
      const feature = "advanced-search";
      const requiredCapabilities = ["indexing", "full-text-search"];
      const availableCapabilities = ["basic-search"];
      const error = new UCDStoreUnsupportedFeature(feature, requiredCapabilities, availableCapabilities);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UCDStoreError);
      expect(error).toBeInstanceOf(UCDStoreUnsupportedFeature);
      expect(error.name).toBe("UCDStoreUnsupportedFeature");
      expect(error.feature).toBe(feature);
      expect(error.requiredCapabilities).toEqual(requiredCapabilities);
      expect(error.availableCapabilities).toEqual(availableCapabilities);
    });

    it("should format message correctly with multiple capabilities", () => {
      const feature = "unicode-normalization";
      const requiredCapabilities = ["nfc", "nfd", "nfkc", "nfkd"];
      const availableCapabilities = ["nfc", "nfd"];
      const error = new UCDStoreUnsupportedFeature(feature, requiredCapabilities, availableCapabilities);

      const expectedMessage = `Feature "unicode-normalization" is not supported. Required capabilities: nfc, nfd, nfkc, nfkd. Available capabilities: nfc, nfd`;
      expect(error.message).toBe(expectedMessage);
    });

    it("should handle single capability arrays", () => {
      const feature = "compression";
      const requiredCapabilities = ["gzip"];
      const availableCapabilities = ["deflate"];
      const error = new UCDStoreUnsupportedFeature(feature, requiredCapabilities, availableCapabilities);

      const expectedMessage = `Feature "compression" is not supported. Required capabilities: gzip. Available capabilities: deflate`;
      expect(error.message).toBe(expectedMessage);
    });

    it("should handle empty capability arrays", () => {
      const feature = "experimental-feature";
      const requiredCapabilities: string[] = [];
      const availableCapabilities: string[] = [];
      const error = new UCDStoreUnsupportedFeature(feature, requiredCapabilities, availableCapabilities);

      const expectedMessage = `Feature "experimental-feature" is not supported. Required capabilities: . Available capabilities: `;
      expect(error.message).toBe(expectedMessage);
    });

    it("should preserve original arrays without mutation", () => {
      const feature = "caching";
      const requiredCapabilities = ["memory", "disk"];
      const availableCapabilities = ["memory"];
      const originalRequired = [...requiredCapabilities];
      const originalAvailable = [...availableCapabilities];

      const error = new UCDStoreUnsupportedFeature(feature, requiredCapabilities, availableCapabilities);

      expect(error.requiredCapabilities).toEqual(originalRequired);
      expect(error.availableCapabilities).toEqual(originalAvailable);
      expect(requiredCapabilities).toEqual(originalRequired);
      expect(availableCapabilities).toEqual(originalAvailable);
    });
  });
});
