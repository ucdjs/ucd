import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { configure, mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../../src/core/context";
import { mirror } from "../../src/operations/mirror";

describe("mirror", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  it("should mirror all versions by default", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0", "15.1.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await mirror(context);

    expect(error).toBeNull();
    expect(data).toBeDefined();

    expect(data?.timestamp).toEqual(expect.any(String));

    const versionKeys = [...data!.versions.keys()];
    expect(versionKeys).toEqual(["16.0.0", "15.1.0"]);

    const v16 = data!.versions.get("16.0.0")!;

    expect(v16).toMatchObject({
      version: "16.0.0",
      files: {
        downloaded: expect.any(Array),
        skipped: expect.any(Array),
        failed: expect.any(Array),
      },
      counts: {
        downloaded: expect.any(Number),
        skipped: expect.any(Number),
        failed: expect.any(Number),
      },
      errors: expect.any(Array),
    });

    expect(data?.summary).toBeDefined();
    expect(data?.summary).toMatchObject({
      counts: {
        downloaded: 6,
        failed: 0,
        skipped: 0,
        totalFiles: 6,
      },
      duration: expect.any(Number),
      metrics: {
        averageTimePerFile: expect.any(Number),
        cacheHitRate: 0,
        failureRate: 0,
        successRate: 100,
      },
      storage: {
        averageFileSize: "20.00 B",
        totalSize: "120.00 B",
      },
    });
  });

  it("should mirror specific versions when provided", async () => {
    const providedVersions = ["16.0.0", "15.1.0", "15.0.0"];

    mockStoreApi({
      versions: providedVersions,
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: providedVersions,
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await mirror(context, {
      versions: ["16.0.0"],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const versionKeys = [...data!.versions.keys()];

    expect(versionKeys).toEqual(["16.0.0"]);

    const v16 = data!.versions.get("16.0.0")!;

    expect(v16).toMatchObject({
      version: "16.0.0",
      files: {
        downloaded: expect.any(Array),
        skipped: expect.any(Array),
        failed: expect.any(Array),
      },
      counts: {
        downloaded: expect.any(Number),
        skipped: expect.any(Number),
        failed: expect.any(Number),
      },
      errors: expect.any(Array),
    });
  });

  it("should support force option to re-download existing files", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [
          {
            name: "cased.txt",
            path: "cased.txt",
            type: "file",
          },
          {
            name: "common.txt",
            path: "common.txt",
            type: "file",
          },
          {
            name: "scripts.txt",
            path: "scripts.txt",
            type: "file",
          },
        ],
        "/api/v1/files/{wildcard}": ({ params }) => {
          return HttpResponse.text(`Content of ${params.wildcard}`);
        },
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/16.0.0/cased.txt": "existing content",
        "/test/16.0.0/common.txt": "existing content",
        "/test/16.0.0/scripts.txt": "existing content",
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [firstMirrorData, firstMirrorError] = await mirror(context, {
      force: false,
    });
    expect(firstMirrorError).toBeNull();
    expect(firstMirrorData).toBeDefined();

    const firstV16 = firstMirrorData!.versions.get("16.0.0")!;
    expect(firstV16.counts.downloaded).toBe(0);
    expect(firstV16.counts.skipped).toBeGreaterThan(0);
    const skippedCount = firstV16.counts.skipped;

    const originalCasedContent = await fs.read("/test/16.0.0/cased.txt");
    const originalCommonContent = await fs.read("/test/16.0.0/common.txt");
    const originalScriptsContent = await fs.read("/test/16.0.0/scripts.txt");

    expect(originalCasedContent).toBe("existing content");
    expect(originalCommonContent).toBe("existing content");
    expect(originalScriptsContent).toBe("existing content");

    const [secondMirrorData, secondMirrorError] = await mirror(context, {
      force: true,
    });
    expect(secondMirrorError).toBeNull();
    expect(secondMirrorData).toBeDefined();

    const secondV16 = secondMirrorData!.versions.get("16.0.0")!;
    expect(secondV16.files.downloaded.length).toBe(skippedCount);
    expect(secondV16.counts.downloaded).toBe(skippedCount);
    expect(secondV16.counts.skipped).toBe(0);

    const updatedCasedContent = await fs.read("/test/16.0.0/cased.txt");
    const updatedCommonContent = await fs.read("/test/16.0.0/common.txt");
    const updatedScriptsContent = await fs.read("/test/16.0.0/scripts.txt");

    expect(updatedCasedContent).not.toBe(originalCasedContent);
    expect(updatedCommonContent).not.toBe(originalCommonContent);
    expect(updatedScriptsContent).not.toBe(originalScriptsContent);
  });

  it("should support custom concurrency limit", async () => {
    const DELAY_MS = 30;
    const FILE_COUNT = 10;
    const CONCURRENCY_LIMIT = 5;

    let currentConcurrent = 0;
    let maxConcurrent = 0;

    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": Array.from({ length: FILE_COUNT }, (_, i) => ({
          name: `file${i}.txt`,
          path: `file${i}.txt`,
          type: "file",
        })),
        "/api/v1/files/{wildcard}": configure({
          response: async () => {
            currentConcurrent++;
            maxConcurrent = Math.max(maxConcurrent, currentConcurrent);

            await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

            currentConcurrent--;
            return HttpResponse.text("file content");
          },
        }),
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await mirror(context, {
      concurrency: CONCURRENCY_LIMIT,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.versions.size).toBe(1);

    const v16 = data!.versions.get("16.0.0")!;
    expect(v16.counts.downloaded).toBe(FILE_COUNT);

    expect(maxConcurrent).toBeLessThanOrEqual(CONCURRENCY_LIMIT);
    expect(maxConcurrent).toBeGreaterThanOrEqual(2);
  });
});
