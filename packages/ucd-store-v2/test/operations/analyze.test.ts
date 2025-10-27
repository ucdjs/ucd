import type { UnicodeTree } from "@ucdjs/schemas";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../../src/core/context";
import { analyze } from "../../src/operations/analyze";

describe("analyze", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  it("should analyze complete version with all files present", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "UnicodeData.txt",
            path: "UnicodeData.txt",
            lastModified: Date.now(),
          },
          {
            type: "file",
            name: "ReadMe.txt",
            path: "ReadMe.txt",
            lastModified: Date.now(),
          },
        ] satisfies UnicodeTree,
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/16.0.0/ReadMe.txt": "readme",
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

    const [data, error] = await analyze(context);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toHaveLength(1);
    expect(data![0]).toEqual({
      version: "16.0.0",
      isComplete: true,
      orphanedFiles: [],
      missingFiles: [],
      files: ["UnicodeData.txt", "ReadMe.txt"],
      expectedFileCount: 2,
      fileCount: 2,
      totalSize: "N/A",
      fileTypes: {
        ".txt": 2,
      },
    });
  });

  it("should detect missing files", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "UnicodeData.txt",
            path: "UnicodeData.txt",
            lastModified: Date.now(),
          },
          {
            type: "file",
            name: "ReadMe.txt",
            path: "ReadMe.txt",
            lastModified: Date.now(),
          },
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "ArabicShaping.txt",
            lastModified: Date.now(),
          },
        ] satisfies UnicodeTree,
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/16.0.0/UnicodeData.txt": "data",
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

    const [data, error] = await analyze(context);

    expect(error).toBeNull();
    expect(data).toBeDefined();

    expect(data).toHaveLength(1);
    expect(data![0]).toEqual({
      version: "16.0.0",
      isComplete: false,
      orphanedFiles: [],
      missingFiles: ["ReadMe.txt", "ArabicShaping.txt"],
      files: ["UnicodeData.txt"],
      expectedFileCount: 3,
      fileCount: 1,
      totalSize: "N/A",
      fileTypes: {
        ".txt": 1,
      },
    });
  });

  it("should detect orphaned files", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "UnicodeData.txt",
            path: "UnicodeData.txt",
            lastModified: Date.now(),
          },
        ] satisfies UnicodeTree,
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/16.0.0/OrphanedFile.txt": "orphaned",
        "/test/16.0.0/AnotherOrphan.html": "orphaned",
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

    const [data, error] = await analyze(context);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data![0]).toEqual({
      version: "16.0.0",
      isComplete: false,
      orphanedFiles: ["OrphanedFile.txt", "AnotherOrphan.html"],
      missingFiles: [],
      files: ["UnicodeData.txt"],
      expectedFileCount: 1,
      fileCount: 1,
      totalSize: "N/A",
      fileTypes: {
        ".txt": 2,
        ".html": 1,
      },
    });
  });

  it("should detect both missing and orphaned files", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "UnicodeData.txt",
            path: "UnicodeData.txt",
            lastModified: Date.now(),
          },
          {
            type: "file",
            name: "ReadMe.txt",
            path: "ReadMe.txt",
            lastModified: Date.now(),
          },
        ] satisfies UnicodeTree,
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/16.0.0/OrphanedFile.txt": "orphaned",
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

    const [data, error] = await analyze(context);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data![0]).toEqual({
      version: "16.0.0",
      isComplete: false,
      orphanedFiles: ["OrphanedFile.txt"],
      missingFiles: ["ReadMe.txt"],
      files: ["UnicodeData.txt"],
      expectedFileCount: 2,
      fileCount: 1,
      totalSize: "N/A",
      fileTypes: {
        ".txt": 2,
      },
    });
  });

  it("should analyze multiple versions", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          if (params.version === "16.0.0") {
            return HttpResponse.json([
              {
                type: "file",
                name: "UnicodeData.txt",
                path: "UnicodeData.txt",
                lastModified: Date.now(),
              },
            ] satisfies UnicodeTree);
          }

          return HttpResponse.json([
            {
              type: "file",
              name: "ReadMe.txt",
              path: "ReadMe.txt",
              lastModified: Date.now(),
            },
          ] satisfies UnicodeTree);
        },
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/15.1.0/ReadMe.txt": "readme",
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0", "15.1.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await analyze(context);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toHaveLength(2);
    expect(data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        version: "16.0.0",
        isComplete: true,
        fileCount: 1,
      }),
      expect.objectContaining({
        version: "15.1.0",
        isComplete: true,
        fileCount: 1,
      }),
    ]));
  });

  it("should analyze only specified versions", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0", "15.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "UnicodeData.txt",
            path: "UnicodeData.txt",
            lastModified: Date.now(),
          },
        ] satisfies UnicodeTree,
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/15.1.0/UnicodeData.txt": "data",
        "/test/15.0.0/UnicodeData.txt": "data",
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0", "15.1.0", "15.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await analyze(context, {
      versions: ["16.0.0", "15.1.0"],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toHaveLength(2);
    expect(data!.map((v) => v.version)).toEqual(["16.0.0", "15.1.0"]);
  });

  it("should skip versions not in store", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
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

    const [data, error] = await analyze(context, {
      versions: ["16.0.0", "99.0.0"],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toHaveLength(1);
    expect(data![0]?.version).toBe("16.0.0");
  });

  it("should handle files without extensions", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "README",
            path: "README",
            lastModified: Date.now(),
          },
        ] satisfies UnicodeTree,
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/16.0.0/README": "readme",
        "/test/16.0.0/ORPHAN": "orphaned",
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

    const [data, error] = await analyze(context);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data![0]?.fileTypes).toEqual({
      no_extension: 2,
    });
  });

  it("should handle empty store", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "UnicodeData.txt",
            path: "UnicodeData.txt",
            lastModified: Date.now(),
          },
        ] satisfies UnicodeTree,
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

    const [data, error] = await analyze(context);

    expect(error).toBeNull();
    expect(data).toBeDefined();

    expect(data![0]).toEqual({
      version: "16.0.0",
      isComplete: false,
      orphanedFiles: [],
      missingFiles: ["UnicodeData.txt"],
      files: [],
      expectedFileCount: 1,
      fileCount: 0,
      totalSize: "N/A",
      fileTypes: {},
    });
  });

  it("should handle API errors when fetching file tree", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": {
          status: 500,
          message: "Internal Server Error",
          timestamp: new Date().toISOString(),
        },
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

    const [_data, error] = await analyze(context);

    expect(error).toBeDefined();
    expect(error?.message).toContain("Failed to fetch expected files");
  });

  it("should count different file types correctly", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "file1.txt",
            path: "file1.txt",
            lastModified: Date.now(),
          },
          {
            type: "file",
            name: "file2.txt",
            path: "file2.txt",
            lastModified: Date.now(),
          },
          {
            type: "file",
            name: "file3.html",
            path: "file3.html",
            lastModified: Date.now(),
          },
        ] satisfies UnicodeTree,
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/16.0.0/file1.txt": "data",
        "/test/16.0.0/file2.txt": "data",
        "/test/16.0.0/file3.html": "html",
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

    const [data, error] = await analyze(context);

    expect(error).toBeNull();
    expect(data![0]?.fileTypes).toEqual({
      ".txt": 2,
      ".html": 1,
    });
  });
});
