import type { VersionComparison } from "../../src/operations/compare";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../../src/core/context";
import { compare } from "../../src/operations/compare";

describe("compare", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  it("should detect added, removed, and modified files between versions", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          if (params.version === "15.1.0") {
            return HttpResponse.json([
              { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
              { type: "file", name: "ReadMe.txt", path: "ReadMe.txt", lastModified: Date.now() },
            ]);
          }

          return HttpResponse.json([
            { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
            { type: "file", name: "NewFile.txt", path: "NewFile.txt", lastModified: Date.now() },
          ]);
        },
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/15.1.0/UnicodeData.txt": "old data",
        "/test/15.1.0/ReadMe.txt": "old readme",
        "/test/16.0.0/UnicodeData.txt": "new data",
        "/test/16.0.0/NewFile.txt": "new file",
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

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toEqual({
      from: "15.1.0",
      to: "16.0.0",
      files: {
        added: ["NewFile.txt"],
        removed: ["ReadMe.txt"],
        modified: ["UnicodeData.txt"],
        unchanged: [],
      },
      counts: {
        fromTotal: 2,
        toTotal: 2,
        added: 1,
        removed: 1,
        modified: 1,
        unchanged: 0,
      },
    } satisfies VersionComparison);
  });

  it("should distinguish between modified and unchanged files", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          if (params.version === "15.1.0") {
            return HttpResponse.json([
              { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
              { type: "file", name: "ReadMe.txt", path: "ReadMe.txt", lastModified: Date.now() },
            ]);
          }

          return HttpResponse.json([
            { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
            { type: "file", name: "ReadMe.txt", path: "ReadMe.txt", lastModified: Date.now() },
            { type: "file", name: "NewFile.txt", path: "NewFile.txt", lastModified: Date.now() },
          ]);
        },
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/15.1.0/UnicodeData.txt": "old data",
        "/test/15.1.0/ReadMe.txt": "same content",
        "/test/16.0.0/UnicodeData.txt": "new data",
        "/test/16.0.0/ReadMe.txt": "same content",
        "/test/16.0.0/NewFile.txt": "new file",
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

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toEqual({
      from: "15.1.0",
      to: "16.0.0",
      files: {
        added: ["NewFile.txt"],
        removed: [],
        modified: ["UnicodeData.txt"],
        unchanged: ["ReadMe.txt"],
      },
      counts: {
        fromTotal: 2,
        toTotal: 3,
        added: 1,
        removed: 0,
        modified: 1,
        unchanged: 1,
      },
    } satisfies VersionComparison);
  });

  it("should show no changes when versions are identical", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [
          { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
          { type: "file", name: "ReadMe.txt", path: "ReadMe.txt", lastModified: Date.now() },
        ],
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

    const [data, error] = await compare(context, {
      from: "16.0.0",
      to: "16.0.0",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toEqual({
      from: "16.0.0",
      to: "16.0.0",
      files: {
        added: [],
        removed: [],
        modified: [],
        unchanged: ["UnicodeData.txt", "ReadMe.txt"],
      },
      counts: {
        fromTotal: 2,
        toTotal: 2,
        added: 0,
        removed: 0,
        modified: 0,
        unchanged: 2,
      },
    } satisfies VersionComparison);
  });

  it("should throw error when from version is not in store", async () => {
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

    const [_data, error] = await compare(context, {
      from: "99.0.0",
      to: "16.0.0",
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain("Version '99.0.0' does not exist in the store.");
  });

  it("should throw error when to version is not in store", async () => {
    mockStoreApi({
      versions: ["15.1.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/15.1.0/UnicodeData.txt": "data",
        "/test/15.1.0/test.html": "html",
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["15.1.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [_data, error] = await compare(context, {
      from: "15.1.0",
      to: "99.0.0",
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain("Version '99.0.0' does not exist in the store.");
  });

  it("should throw error when options are not provided", async () => {
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

    const [_data, error] = await compare(context);

    expect(error).toBeDefined();
    expect(error?.message).toContain("Both 'from' and 'to' versions must be specified");
  });

  it("should handle comparison with filters", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          if (params.version === "15.1.0") {
            return HttpResponse.json([
              { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
              { type: "file", name: "test.html", path: "test.html", lastModified: Date.now() },
            ]);
          }

          return HttpResponse.json([
            { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
            { type: "file", name: "NewFile.txt", path: "NewFile.txt", lastModified: Date.now() },
          ]);
        },
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/15.1.0/UnicodeData.txt": "data",
        "/test/15.1.0/test.html": "html",
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/16.0.0/NewFile.txt": "new",
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

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      filters: {
        include: ["**/*.txt"],
      },
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.files.added).toEqual(["NewFile.txt"]);
    expect(data?.files.removed).toEqual([]);
    expect(data?.counts.fromTotal).toBe(1);
    expect(data?.counts.toTotal).toBe(2);
  });

  it("should handle empty versions gracefully", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": [],
      },
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

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toEqual({
      from: "15.1.0",
      to: "16.0.0",
      files: {
        added: [],
        removed: [],
        modified: [],
        unchanged: [],
      },
      counts: {
        fromTotal: 0,
        toTotal: 0,
        added: 0,
        removed: 0,
        modified: 0,
        unchanged: 0,
      },
    } satisfies VersionComparison);
  });

  it("should use local-local mode when both versions exist locally", async () => {
    // No API responses needed for local-local mode
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      onRequest: ({ url }) => {
        expect.fail(`No API requests should be made in local-local mode, but got request to ${url}`);
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/15.1.0/UnicodeData.txt": "old data",
        "/test/15.1.0/ReadMe.txt": "readme",
        "/test/16.0.0/UnicodeData.txt": "new data",
        "/test/16.0.0/ReadMe.txt": "readme",
        "/test/16.0.0/NewFile.txt": "new",
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

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      allowApi: false, // Local-only mode
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.files.added).toEqual(["NewFile.txt"]);
    expect(data?.files.removed).toEqual([]);
    expect(data?.files.modified).toEqual(["UnicodeData.txt"]);
    expect(data?.files.unchanged).toEqual(["ReadMe.txt"]);
  });

  it("should use api-api mode when allowApi is true and versions not local", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          if (params.version === "15.1.0") {
            return HttpResponse.json([
              { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
            ]);
          }

          return HttpResponse.json([
            { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
            { type: "file", name: "NewFile.txt", path: "NewFile.txt", lastModified: Date.now() },
          ]);
        },
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        // Files exist but will be fetched from API due to mode
        "/test/15.1.0/UnicodeData.txt": "data",
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/16.0.0/NewFile.txt": "new",
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: [], // No local versions in store
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      allowApi: true,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.files.added).toEqual(["NewFile.txt"]);
    expect(data?.files.removed).toEqual([]);
  });

  it("should use local-api mode when from is local and to needs API", async () => {
    mockStoreApi({
      versions: ["15.1.0"], // Only 15.1.0 in manifest
      responses: {
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          // Only 16.0.0 needs API response
          if (params.version === "16.0.0") {
            return HttpResponse.json([
              { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
              { type: "file", name: "NewFile.txt", path: "NewFile.txt", lastModified: Date.now() },
            ]);
          }
          return HttpResponse.json([]);
        },
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/15.1.0/UnicodeData.txt": "data",
        "/test/15.1.0/ReadMe.txt": "readme",
        // 16.0.0 files will come from API
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/16.0.0/NewFile.txt": "new",
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["15.1.0"], // Only 15.1.0 is tracked
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      allowApi: true,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.files.added).toEqual(["NewFile.txt"]);
    expect(data?.files.removed).toEqual(["ReadMe.txt"]);
  });

  it("should allow manually specifying local-local mode", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/15.1.0/UnicodeData.txt": "old data",
        "/test/16.0.0/UnicodeData.txt": "new data",
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

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      mode: "local-local", // Force local-local mode
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.files.modified).toEqual(["UnicodeData.txt"]);
  });

  it("should allow manually specifying api-api mode", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          if (params.version === "15.1.0") {
            return HttpResponse.json([
              { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
              { type: "file", name: "ReadMe.txt", path: "ReadMe.txt", lastModified: Date.now() },
            ]);
          }

          return HttpResponse.json([
            { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
            { type: "file", name: "NewFile.txt", path: "NewFile.txt", lastModified: Date.now() },
          ]);
        },
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        // Files exist locally but we're forcing API mode
        "/test/15.1.0/UnicodeData.txt": "data",
        "/test/15.1.0/ReadMe.txt": "readme",
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/16.0.0/NewFile.txt": "new",
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

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      mode: "api-api", // Force API mode even though files exist locally
      allowApi: true,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    // Should use API file lists
    expect(data?.files.added).toEqual(["NewFile.txt"]);
    expect(data?.files.removed).toEqual(["ReadMe.txt"]);
  });

  it("should allow manually specifying local-api mode", async () => {
    mockStoreApi({
      versions: ["15.1.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          if (params.version === "16.0.0") {
            return HttpResponse.json([
              { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
              { type: "file", name: "NewFile.txt", path: "NewFile.txt", lastModified: Date.now() },
            ]);
          }
          return HttpResponse.json([]);
        },
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/15.1.0/UnicodeData.txt": "data",
        "/test/15.1.0/ReadMe.txt": "readme",
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/16.0.0/NewFile.txt": "new",
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["15.1.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      mode: "local-api", // Force local-api mode
      allowApi: true,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.files.added).toEqual(["NewFile.txt"]);
    expect(data?.files.removed).toEqual(["ReadMe.txt"]);
  });

  it("should allow manually specifying api-local mode", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          if (params.version === "15.1.0") {
            return HttpResponse.json([
              { type: "file", name: "UnicodeData.txt", path: "UnicodeData.txt", lastModified: Date.now() },
              { type: "file", name: "ReadMe.txt", path: "ReadMe.txt", lastModified: Date.now() },
            ]);
          }
          return HttpResponse.json([]);
        },
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/15.1.0/UnicodeData.txt": "data",
        "/test/15.1.0/ReadMe.txt": "readme",
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/16.0.0/NewFile.txt": "new",
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

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      mode: "api-local", // Force api-local mode
      allowApi: true,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.files.added).toEqual(["NewFile.txt"]);
    expect(data?.files.removed).toEqual(["ReadMe.txt"]);
  });

  it("should throw error when mode is local-local but from version not local", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/16.0.0/UnicodeData.txt": "data",
        // 15.1.0 doesn't exist locally
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

    const [_data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      mode: "local-local", // Force local-local but from doesn't exist
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain("Cannot use mode 'local-local'");
    expect(error?.message).toContain("'from' version '15.1.0' is not available locally");
  });

  it("should throw error when mode is local-local but to version not local", async () => {
    mockStoreApi({
      versions: ["15.1.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/15.1.0/UnicodeData.txt": "data",
        // 16.0.0 doesn't exist locally
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["15.1.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [_data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      mode: "local-local", // Force local-local but to doesn't exist
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain("Cannot use mode 'local-local'");
    expect(error?.message).toContain("'to' version '16.0.0' is not available locally");
  });

  it("should throw error when mode requires API but allowApi is false", async () => {
    mockStoreApi({
      versions: ["15.1.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/15.1.0/UnicodeData.txt": "data",
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["15.1.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [_data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      mode: "local-api", // Requires API
      allowApi: false, // But API is disabled
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain("Cannot use mode 'local-api'");
    expect(error?.message).toContain("requires API access but allowApi is false");
  });

  it("should throw error when mode is local-api but from version not local", async () => {
    mockStoreApi({
      versions: [],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        // No local files
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: [],
      manifestPath: "/test/.ucd-store.json",
    });

    const [_data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      mode: "local-api", // Requires from to be local
      allowApi: true,
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain("Cannot use mode 'local-api'");
    expect(error?.message).toContain("'from' version '15.1.0' is not available locally");
  });

  it("should throw error when mode is api-local but to version not local", async () => {
    mockStoreApi({
      versions: [],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        // No local files
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: [],
      manifestPath: "/test/.ucd-store.json",
    });

    const [_data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
      mode: "api-local", // Requires to to be local
      allowApi: true,
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain("Cannot use mode 'api-local'");
    expect(error?.message).toContain("'to' version '16.0.0' is not available locally");
  });

  it("should ignore orphaned files in comparison", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      responses: {
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          if (params.version === "15.1.0") {
            return HttpResponse.json([
              {
                type: "file",
                name: "UnicodeData.txt",
                path: "UnicodeData.txt",
                lastModified: Date.now(),
              },
            ]);
          }

          return HttpResponse.json([
            {
              type: "file",
              name: "UnicodeData.txt",
              path: "UnicodeData.txt",
              lastModified: Date.now(),
            },
            {
              type: "file",
              name: "NewFile.txt",
              path: "NewFile.txt",
              lastModified: Date.now(),
            },
          ]);
        },
      },
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        // Both versions have expected files
        "/test/15.1.0/UnicodeData.txt": "data",
        "/test/16.0.0/UnicodeData.txt": "data",
        "/test/16.0.0/NewFile.txt": "new",

        // Orphaned files that shouldn't affect comparison
        "/test/15.1.0/OrphanedOldFile.txt": "orphan",
        "/test/16.0.0/OrphanedNewFile.txt": "orphan",
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

    const [data, error] = await compare(context, {
      from: "15.1.0",
      to: "16.0.0",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    // Orphaned files should not appear in the comparison
    expect(data?.files.added).toEqual(["NewFile.txt"]);
    expect(data?.files.removed).toEqual([]);
    expect(data?.files.unchanged).toEqual(["UnicodeData.txt"]);
    expect(data?.counts.added).toBe(1);
    expect(data?.counts.fromTotal).toBe(1);
    expect(data?.counts.toTotal).toBe(2);
  });
});
