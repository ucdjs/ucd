import type { ApiError } from "@ucdjs/fetch";
import { existsSync } from "node:fs";
import { HttpResponse, mockFetch } from "#internal/test-utils/msw";
import { setupMockStore } from "#internal/test-utils/store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { assertCapability } from "@ucdjs/fs-bridge";
import { createNodeUCDStore } from "@ucdjs/ucd-store";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";

describe("store mirror", () => {
  beforeEach(() => {
    setupMockStore({
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
    const mirrorResult = await store.mirror();

    expect(mirrorResult.errors).toHaveLength(0);

    assert(mirrorResult.success === true, "Expected mirror operation to be successful");
    assert(mirrorResult.data[0] != null, "Expected at least one version to be mirrored");

    expect(mirrorResult.data[0].failed).toHaveLength(0);
    expect(mirrorResult.data[0].mirrored).toHaveLength(3);
    expect(mirrorResult.data[0].skipped).toHaveLength(0);
    expect(mirrorResult.data[0].version).toBe("15.0.0");

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
    const mirrorResults = await store.mirror();

    assert(mirrorResults.success === true, "Expected mirror operation to be successful");

    const [mirror15Result, mirror16Result] = mirrorResults.data;
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
    const mirrorResult = await store.mirror({ dryRun: true });

    assert(mirrorResult.success === true, "Expected mirror operation to be successful");
    assert(mirrorResult.data[0] != null, "Expected at least one version to be mirrored");

    expect(mirrorResult.data[0].mirrored).toHaveLength(3);
    expect(mirrorResult.data[0].skipped).toHaveLength(0);
    expect(mirrorResult.data[0].version).toBe("15.0.0");

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
    const mirrorResult = await store.mirror({ force: true });

    assert(mirrorResult.success === true, "Expected mirror operation to be successful");
    assert(mirrorResult.data[0] != null, "Expected at least one version to be mirrored");

    expect(mirrorResult.data[0].mirrored).toHaveLength(3);
    expect(mirrorResult.data[0].skipped).toHaveLength(0);
    expect(mirrorResult.data[0].version).toBe("15.0.0");

    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(true);

    const newContent = await store.getFile("15.0.0", "ArabicShaping.txt");

    expect(newContent).toBe("File content");
  });

  it("should require store to be initialized", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    const mirrorResult = await store.mirror();

    assert(mirrorResult.success === false, "Expected mirror operation to be unsuccessful");
    assert(mirrorResult.data === undefined, "Expected no versions to be mirrored");

    expect(mirrorResult.data).toBeUndefined();
    expect(mirrorResult.errors).toHaveLength(1);

    assert(mirrorResult.errors[0] != null, "Expected error to be present");
    expect(mirrorResult.errors[0].type).toBe("NOT_INITIALIZED");
    expect(mirrorResult.errors[0].message).toBe("Store is not initialized. Please initialize the store before performing operations.");
  });

  it("should require concurrency to be higher than 0", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    const mirrorResult = await store.mirror({ concurrency: 0 });

    assert(mirrorResult.success === false, "Expected mirror operation to be unsuccessful");
    assert(mirrorResult.data === undefined, "Expected no versions to be mirrored");

    expect(mirrorResult.data).toBeUndefined();
    expect(mirrorResult.errors).toHaveLength(1);

    assert(mirrorResult.errors[0] != null, "Expected error to be present");
    expect(mirrorResult.errors[0].type).toBe("GENERIC");
    expect(mirrorResult.errors[0].message).toBe("Concurrency must be at least 1");
  });

  it("should handle version not found error", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    const mirrorResult = await store.mirror({ versions: ["99.99.99"] });

    assert(mirrorResult.success === false, "Expected mirror operation to be unsuccessful");
    assert(mirrorResult.data === undefined, "Expected no versions to be mirrored");

    expect(mirrorResult.data).toBeUndefined();
    expect(mirrorResult.errors).toHaveLength(1);

    assert(mirrorResult.errors[0] != null, "Expected error to be present");
    expect(mirrorResult.errors[0].type).toBe("UNSUPPORTED_VERSION");
    expect(mirrorResult.errors[0].message).toBe("Version '99.99.99' does not exist in the store.");
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

    const mirrorResult = await store.mirror();

    assert(mirrorResult.success === false, "Expected mirror operation to be unsuccessful");
    assert(mirrorResult.data === undefined, "Expected no versions to be mirrored");

    expect(mirrorResult.data).toBeUndefined();
    expect(mirrorResult.errors).toHaveLength(1);

    assert(mirrorResult.errors[0] != null, "Expected error to be present");
    expect(mirrorResult.errors[0].type).toBe("GENERIC");
    expect(mirrorResult.errors[0].message).toBe("Failed to fetch expected files for version '15.0.0': Internal Server Error");
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

    const mirrorResult = await store.mirror();
    expect(callCount).toBe(3);

    assert(mirrorResult.success === true, "Expected mirror operation to be successful");
    assert(mirrorResult.data[0] != null, "Expected at least one version to be mirrored");

    expect(mirrorResult.data[0].mirrored).toHaveLength(3);
    expect(mirrorResult.data[0].skipped).toHaveLength(0);
    expect(mirrorResult.data[0].version).toBe("15.0.0");
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

    const mirrorResult = await store.mirror();

    assert(mirrorResult.success === false, "Expected mirror operation to be unsuccessful");
    assert(mirrorResult.data != null, "Expected no versions to be mirrored");

    assert(mirrorResult.data[0] != null, "Expected at least one version in mirrorResult.data");
    expect(mirrorResult.errors).toHaveLength(0);

    expect(mirrorResult.data[0].failed).toHaveLength(3);
    expect(mirrorResult.data[0].skipped).toHaveLength(0);
    expect(mirrorResult.data[0].mirrored).toHaveLength(0);
    expect(mirrorResult.data[0].version).toBe("15.0.0");
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

    const mirrorResult = await store.mirror();

    assert(mirrorResult.success === false, "Expected mirror operation to be unsuccessful");
    expect(mirrorResult.data).toBeUndefined();
    expect(mirrorResult.errors).toHaveLength(1);

    assert(mirrorResult.errors[0] != null, "Expected error to be present");
    expect(mirrorResult.errors[0].type).toBe("GENERIC");
    expect(mirrorResult.errors[0].message).toBe("Failed to fetch");
  });
});
