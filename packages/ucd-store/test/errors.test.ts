/* eslint-disable test/prefer-lowercase-title */
import { describe, expect, it } from "vitest";
import {
  UCDStoreError,
  UCDStoreFileNotFoundError,
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

    it("should format message correctly with different inputs", () => {
      const testCases = [
        { filePath: "/data/unicode.txt", version: "15.0.0" },
        { filePath: "/blocks/basic-latin.txt", version: "14.0.0" },
        { filePath: "/derived/combining-class.txt", version: "13.0.0" },
        { filePath: "/path/with spaces/file-name.txt", version: "1.0.0" },
      ];

      testCases.forEach(({ filePath, version }) => {
        const error = new UCDStoreFileNotFoundError(filePath, version);
        expect(error.message).toBe(`File not found: ${filePath} in version ${version}`);
        expect(error.filePath).toBe(filePath);
        expect(error.version).toBe(version);
      });
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

    it("should handle different version formats", () => {
      const versions = ["15.0.0", "14.0.0", "1.0", "2.0.0", "3.0.0-beta", "4.0.0-alpha.1"];

      versions.forEach((version) => {
        const error = new UCDStoreVersionNotFoundError(version);
        expect(error.message).toBe(`Version not found: ${version}`);
        expect(error.version).toBe(version);
      });
    });
  });
});
