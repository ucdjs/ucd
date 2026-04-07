import {
  createHTTPUCDStore,
  createNodeUCDStore,
  createUCDStore,
  UCDStoreApiFallbackError,
  UCDStoreFilterError,
  UCDStoreGenericError,
  validateVersions,
} from "@ucdjs/ucd-store";
import { describe, expect, it } from "vitest";

describe("public package entrypoint", () => {
  it("should export the public store factory functions", () => {
    expect(createUCDStore).toBeTypeOf("function");
    expect(createNodeUCDStore).toBeTypeOf("function");
    expect(createHTTPUCDStore).toBeTypeOf("function");
  });

  it("should export public validation helpers", () => {
    expect(validateVersions).toBeTypeOf("function");
  });

  it("should export runtime error types used by file operations", () => {
    const filterError = new UCDStoreFilterError("filtered", {
      excludePattern: ["*.json"],
      includePattern: ["*.txt"],
      filePath: "UnicodeData.json",
    });
    const fallbackError = new UCDStoreApiFallbackError({
      version: "16.0.0",
      filePath: "UnicodeData.txt",
      reason: "fetch-failed",
      status: 500,
    });

    expect(filterError).toBeInstanceOf(UCDStoreFilterError);
    expect(filterError).toBeInstanceOf(Error);
    expect(fallbackError).toBeInstanceOf(UCDStoreApiFallbackError);
    expect(fallbackError).toBeInstanceOf(Error);
    expect(new UCDStoreGenericError("generic")).toBeInstanceOf(UCDStoreGenericError);
  });
});
