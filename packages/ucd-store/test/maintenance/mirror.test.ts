import type { ApiError } from "@ucdjs/schemas";
import { existsSync } from "node:fs";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { assertCapability } from "@ucdjs/fs-bridge";
import { createNodeUCDStore } from "@ucdjs/ucd-store";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";

describe("store mirror", () => {
  beforeEach(() => {
    mockStoreApi({
      baseUrl: UCDJS_API_BASE_URL,
      responses: {
        "/api/v1/versions": [...UNICODE_VERSION_METADATA],
        "/api/v1/versions/:version/file-tree": [
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "ArabicShaping.txt",
            lastModified: 1644920820000,
          },
          {
            type: "file",
            name: "BidiBrackets.txt",
            path: "BidiBrackets.txt",
            lastModified: 1651584360000,
          },
          {
            type: "directory",
            name: "extracted",
            path: "extracted",
            lastModified: 1724676960000,
            children: [
              {
                type: "file",
                name: "DerivedBidiClass.txt",
                path: "DerivedBidiClass.txt",
                lastModified: 1724609100000,
              },
            ],
          },
        ],
        "/api/v1/files/:wildcard": () => {
          return HttpResponse.text("File content");
        },
      },
    });

    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should mirror files to store", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    const [mirrorData, mirrorError] = await store.mirror();

    assert(mirrorError === null, "Expected mirror operation to be successful");
    assert(mirrorData != null, "Expected mirror data to be non-null");
    assert(mirrorData[0] != null, "Expected at least one version to be mirrored");

    expect(mirrorData[0].failed).toHaveLength(0);
    expect(mirrorData[0].mirrored).toHaveLength(3);
    expect(mirrorData[0].skipped).toHaveLength(0);
    expect(mirrorData[0].version).toBe("15.0.0");

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/BidiBrackets.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/extracted/DerivedBidiClass.txt`)).toBe(true);
  });

  it("should mirror multiple versions", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0", "16.0.0"],
    });

    await store.init();
    const [mirrorData, mirrorError] = await store.mirror();

    assert(mirrorError === null, "Expected mirror operation to be successful");
    assert(mirrorData != null, "Expected mirror data to be non-null");

    const mirror15Result = mirrorData.find((r) => r.version === "15.0.0");
    const mirror16Result = mirrorData.find((r) => r.version === "16.0.0");
    assert(mirror15Result != null, "Expected mirror result for version 15.0.0");
    assert(mirror16Result != null, "Expected mirror result for version 16.0.0");

    expect(mirror15Result.version).toBe("15.0.0");
    expect(mirror16Result.version).toBe("16.0.0");

    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(true);
    expect(existsSync(`${storePath}/16.0.0/ArabicShaping.txt`)).toBe(true);
  });

  it("should handle dry run mode", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    const [mirrorData, mirrorError] = await store.mirror({ dryRun: true });

    assert(mirrorError === null, "Expected mirror operation to be successful");
    assert(mirrorData != null, "Expected mirror data to be non-null");
    assert(mirrorData[0] != null, "Expected at least one version to be mirrored");

    expect(mirrorData[0].mirrored).toHaveLength(3);
    expect(mirrorData[0].skipped).toHaveLength(0);
    expect(mirrorData[0].version).toBe("15.0.0");

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(false);
  });

  it("should handle force flag", async () => {
    const content = "old content";

    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": content,
      },
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    const [mirrorData, mirrorError] = await store.mirror({ force: true });

    assert(mirrorError === null, "Expected mirror operation to be successful");
    assert(mirrorData != null, "Expected mirror data to be non-null");
    assert(mirrorData[0] != null, "Expected at least one version to be mirrored");

    expect(mirrorData[0].mirrored).toHaveLength(3);
    expect(mirrorData[0].skipped).toHaveLength(0);
    expect(mirrorData[0].version).toBe("15.0.0");

    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(true);

    const [fileData, fileError] = await store.getFile("15.0.0", "ArabicShaping.txt");

    assert(fileError === null, "Expected getFile to succeed");
    expect(fileData).toBe("File content");
  });

  it("should require store to be initialized", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    const [mirrorData, mirrorError] = await store.mirror();

    expect(mirrorData).toBe(null);
    assert(mirrorError != null, "Expected error to be present");
    expect(mirrorError.message).toBe("Store is not initialized. Please initialize the store before performing operations.");
  });

  it("should return failure when concurrency is less than 1", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    const [mirrorData, mirrorError] = await store.mirror({ concurrency: 0 });

    expect(mirrorData).toBe(null);
    assert(mirrorError != null, "Expected error to be present");
    expect(mirrorError.message).toBe("Concurrency must be a positive integer");
  });

  it("should handle version not found error", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    const [mirrorData, mirrorError] = await store.mirror({ versions: ["99.99.99"] });

    expect(mirrorData).toBe(null);
    assert(mirrorError != null, "Expected error to be present");
    expect(mirrorError.message).toBe("Version '99.99.99' does not exist in the store.");
  });

  it("should handle API errors during file fetching", async () => {
    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/:version/file-tree`, () => {
        return HttpResponse.json({
          message: "Internal Server Error",
          status: 500,
          timestamp: new Date().toISOString(),
        } satisfies ApiError, { status: 500 });
      }],
    ]);

    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    const [mirrorData, mirrorError] = await store.mirror();

    expect(mirrorData).toBe(null);
    assert(mirrorError != null, "Expected error to be present");
    expect(mirrorError.message).toBe("Failed to fetch expected files for version '15.0.0': [GET] \"https://api.ucdjs.dev/api/v1/versions/15.0.0/file-tree\": 500 Internal Server Error");
  });

  it("should handle different content types during file download", async () => {
    let callCount = 0;
    const contentTypes = [
      "application/json",
      "text/plain",
      "application/octet-stream",
    ];

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/*`, () => {
        const contentType = contentTypes[callCount];

        assert(contentType != null, "Expected content type to be defined");

        let content = null;

        if (callCount === 0) {
          content = JSON.stringify({ data: "json content" });
        } else if (callCount === 1) {
          content = "text content";
        } else if (callCount === 2) {
          content = new ArrayBuffer(8);
        }

        callCount++;

        return new Response(content, {
          headers: {
            "Content-Type": contentType,
          },
          status: 200,
        });
      }],
    ]);

    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    const [mirrorData, mirrorError] = await store.mirror();
    expect(callCount).toBe(3);

    assert(mirrorError === null, "Expected mirror operation to be successful");
    assert(mirrorData != null, "Expected mirror data to be non-null");
    assert(mirrorData[0] != null, "Expected at least one version to be mirrored");

    expect(mirrorData[0].mirrored).toHaveLength(3);
    expect(mirrorData[0].skipped).toHaveLength(0);
    expect(mirrorData[0].version).toBe("15.0.0");
  });

  it("should handle file operation errors during mirroring", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    assertCapability(store.fs, "write");
    vi.spyOn(store.fs, "write").mockImplementation(async () => {
      throw new Error("Disk full");
    });

    const [mirrorData, mirrorError] = await store.mirror();

    assert(mirrorError === null, "Expected mirror operation to be successful");
    assert(mirrorData != null, "Expected mirror result data to be non-null");
    assert(mirrorData[0] != null, "Expected at least one version in mirror data");

    expect(mirrorData[0].failed).toHaveLength(3);
    expect(mirrorData[0].skipped).toHaveLength(0);
    expect(mirrorData[0].mirrored).toHaveLength(0);
    expect(mirrorData[0].version).toBe("15.0.0");
  });

  it("should return empty result on catastrophic error", async () => {
    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/:version/file-tree`, () => {
        return HttpResponse.error();
      }],
    ]);

    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    const [mirrorData, mirrorError] = await store.mirror();

    expect(mirrorData).toBe(null);
    assert(mirrorError != null, "Expected error to be present");
    expect(mirrorError.message).toBe("Failed to fetch expected files for version '15.0.0': [GET] \"https://api.ucdjs.dev/api/v1/versions/15.0.0/file-tree\": <no response> Failed to fetch");
  });
});
