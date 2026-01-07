import { mockStoreApi } from "#test-utils/mock-store";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createNodeUCDStore } from "../../src/factory";

describe.todo("file paths", () => {
  beforeEach(() => {
    mockStoreApi({
      baseUrl: UCDJS_API_BASE_URL,
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should get flattened file paths", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": "Arabic shaping data",
        "BidiBrackets.txt": "Bidi brackets data",
        "extracted": {
          "DerivedBidiClass.txt": "Derived bidi class data",
          "nested": {
            "DeepFile.txt": "Deep nested file",
          },
        },
      },
      ".ucd-store.json": JSON.stringify({
        "15.0.0": { expectedFiles: [] },
      }),
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
    });

    await store.init();
    const [filePaths, filePathsError] = await store.getFilePaths("15.0.0");
    assert(filePathsError === null, "Expected getFilePaths to succeed");
    expect(filePaths).toEqual([
      "ArabicShaping.txt",
      "BidiBrackets.txt",
      "extracted/DerivedBidiClass.txt",
      "extracted/nested/DeepFile.txt",
    ]);
  });

  it("should respect filters in getFilePaths", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": "Arabic shaping data",
        "BidiBrackets.txt": "Bidi brackets data",
        "extracted": {
          "DerivedBidiClass.txt": "Derived bidi class data",
          "nested": {
            "DeepFile.txt": "Deep nested file",
          },
        },
      },
      ".ucd-store.json": JSON.stringify({
        "15.0.0": { expectedFiles: [] },
      }),
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
    });

    await store.init();
    const [filePaths, filePathsError] = await store.getFilePaths("15.0.0", {
      exclude: ["**/nested/**"],
    });
    assert(filePathsError === null, "Expected getFilePaths to succeed");
    expect(filePaths).toEqual([
      "ArabicShaping.txt",
      "BidiBrackets.txt",
      "extracted/DerivedBidiClass.txt",
    ]);
  });

  it("should throw error for invalid version in getFilePaths", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": "Arabic shaping data",
      },
      ".ucd-store.json": JSON.stringify({
        "15.0.0": { expectedFiles: [] },
      }),
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
    });

    await store.init();
    const [filePathsData, filePathsError] = await store.getFilePaths("16.0.0");
    expect(filePathsData).toBe(null);
    assert(filePathsError != null, "Expected error for invalid version");
    expect(filePathsError.message).toBe("Version '16.0.0' does not exist in the store.");
  });
});
