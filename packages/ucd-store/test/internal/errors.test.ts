import { describe, expect, it } from "vitest";
import { UCDStoreError } from "../../src/internal/errors";

describe("uCDStoreError", () => {
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
