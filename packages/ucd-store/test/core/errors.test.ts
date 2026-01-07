/* eslint-disable test/prefer-lowercase-title */
import { describe, expect, it } from "vitest";
import {
  UCDStoreBaseError,
  UCDStoreBridgeUnsupportedOperation,
  UCDStoreFileNotFoundError,
  UCDStoreGenericError,
  UCDStoreInvalidManifestError,
  UCDStoreNotInitializedError,
  UCDStoreVersionNotFoundError,
} from "../../src/errors";

describe.todo("custom errors", () => {
  describe.todo("UCDStoreGenericError", () => {
    it("should create an instance with the correct message", () => {
      const message = "Test error message";
      const error = new UCDStoreGenericError(message);

      expect(error.message).toBe(message);
    });

    it("should extend Error class and have correct properties", () => {
      const error = new UCDStoreGenericError("Test message");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UCDStoreBaseError);
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error.name).toBe("UCDStoreGenericError");
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("UCDStoreGenericError");
    });

    it("should accept data parameter", () => {
      const message = "Test error with data";
      const data = { code: 500, details: "Something went wrong" };
      const error = new UCDStoreGenericError(message, data);

      expect(error.message).toBe(message);
      expect(error.data).toEqual(data);
    });
  });

  describe.todo("UCDStoreFileNotFoundError", () => {
    it("should create error with correct properties and inheritance", () => {
      const filePath = "/path/to/file.txt";
      const version = "1.0.0";
      const error = new UCDStoreFileNotFoundError(filePath, version);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UCDStoreBaseError);
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

  describe.todo("UCDStoreVersionNotFoundError", () => {
    it("should create error with correct properties and inheritance", () => {
      const version = "15.0.0";
      const error = new UCDStoreVersionNotFoundError(version);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UCDStoreBaseError);
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error.name).toBe("UCDStoreVersionNotFoundError");
      expect(error.message).toBe(`Version '${version}' does not exist in the store.`);
      expect(error.version).toBe(version);
    });
  });

  describe.todo("UCDStoreBridgeUnsupportedOperation", () => {
    it("should create error with correct properties and inheritance", () => {
      const operation = "advanced-search";
      const requiredCapabilities = ["indexing", "full-text-search"];
      const availableCapabilities = ["basic-search"];
      const error = new UCDStoreBridgeUnsupportedOperation(operation, requiredCapabilities, availableCapabilities);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UCDStoreBaseError);
      expect(error).toBeInstanceOf(UCDStoreBridgeUnsupportedOperation);
      expect(error.name).toBe("UCDStoreBridgeUnsupportedOperation");
      expect(error.operation).toBe(operation);
      expect(error.requiredCapabilities).toEqual(requiredCapabilities);
      expect(error.availableCapabilities).toEqual(availableCapabilities);
    });

    it("should format message correctly with multiple capabilities", () => {
      const operation = "unicode-normalization";
      const requiredCapabilities = ["nfc", "nfd", "nfkc", "nfkd"];
      const availableCapabilities = ["nfc", "nfd"];
      const error = new UCDStoreBridgeUnsupportedOperation(operation, requiredCapabilities, availableCapabilities);

      const expectedMessage = `Operation "unicode-normalization" is not supported. Required capabilities: nfc, nfd, nfkc, nfkd. Available capabilities: nfc, nfd`;
      expect(error.message).toBe(expectedMessage);
    });

    it("should handle single capability arrays", () => {
      const operation = "compression";
      const requiredCapabilities = ["gzip"];
      const availableCapabilities = ["deflate"];
      const error = new UCDStoreBridgeUnsupportedOperation(operation, requiredCapabilities, availableCapabilities);

      const expectedMessage = `Operation "compression" is not supported. Required capabilities: gzip. Available capabilities: deflate`;
      expect(error.message).toBe(expectedMessage);
    });

    it("should handle empty capability arrays", () => {
      const operation = "experimental-feature";
      const requiredCapabilities: string[] = [];
      const availableCapabilities: string[] = [];
      const error = new UCDStoreBridgeUnsupportedOperation(operation, requiredCapabilities, availableCapabilities);

      const expectedMessage = `Operation "experimental-feature" is not supported.`;
      expect(error.message).toBe(expectedMessage);
    });

    it("should preserve original arrays without mutation", () => {
      const operation = "caching";
      const requiredCapabilities = ["memory", "disk"];
      const availableCapabilities = ["memory"];
      const originalRequired = [...requiredCapabilities];
      const originalAvailable = [...availableCapabilities];

      const error = new UCDStoreBridgeUnsupportedOperation(operation, requiredCapabilities, availableCapabilities);

      expect(error.requiredCapabilities).toEqual(originalRequired);
      expect(error.availableCapabilities).toEqual(originalAvailable);
      expect(requiredCapabilities).toEqual(originalRequired);
      expect(availableCapabilities).toEqual(originalAvailable);
    });
  });

  describe.todo("UCDStoreInvalidManifestError", () => {
    it("should create error with correct properties and inheritance", () => {
      const manifestPath = "/path/to/.ucd-store.json";
      const message = "malformed JSON";
      const error = new UCDStoreInvalidManifestError(manifestPath, message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UCDStoreBaseError);
      expect(error).toBeInstanceOf(UCDStoreInvalidManifestError);
      expect(error.name).toBe("UCDStoreInvalidManifestError");
      expect(error.message).toBe(`invalid manifest at ${manifestPath}: ${message}`);
    });

    it("should format error message correctly", () => {
      const manifestPath = "/store/.ucd-store.json";
      const message = "schema validation failed";
      const error = new UCDStoreInvalidManifestError(manifestPath, message);

      expect(error.message).toBe(`invalid manifest at ${manifestPath}: ${message}`);
    });

    it.each([
      { manifestPath: "/store/.ucd-store.json", message: "file is corrupted" },
      { manifestPath: "/tmp/manifest.json", message: "missing required fields" },
      { manifestPath: "/config/store-config.json", message: "invalid version format" },
      { manifestPath: "/home/user/.ucd/manifest.json", message: "unexpected token at line 5" },
    ])("should handle different manifest errors", ({ manifestPath, message }) => {
      const error = new UCDStoreInvalidManifestError(manifestPath, message);

      expect(error.message).toBe(`invalid manifest at ${manifestPath}: ${message}`);
    });
  });

  describe.todo("UCDStoreNotInitializedError", () => {
    it("should create error with correct properties and inheritance", () => {
      const error = new UCDStoreNotInitializedError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(UCDStoreBaseError);
      expect(error).toBeInstanceOf(UCDStoreNotInitializedError);
      expect(error.name).toBe("UCDStoreNotInitializedError");
      expect(error.message).toBe("Store is not initialized. Please initialize the store before performing operations.");
    });

    it("should have consistent error message across multiple instances", () => {
      const error1 = new UCDStoreNotInitializedError();
      const error2 = new UCDStoreNotInitializedError();

      expect(error1.message).toBe(error2.message);
    });
  });
});
