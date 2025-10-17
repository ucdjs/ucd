import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError } from "../../src/errors";
import { bootstrap } from "../../src/v2/bootstrap";
import { readManifest } from "../../src/v2/manifest";

const MOCK_CONFIG = {
  version: "1.0",
  endpoints: {
    files: "/api/v1/files",
    manifest: "/api/v1/files/.ucd-store.json",
    versions: "/api/v1/versions",
  },
};

function createMockVersions(versions: string[]) {
  return versions.map((version) => ({
    version,
    documentationUrl: `https://www.unicode.org/versions/Unicode${version}/`,
    date: "2024",
    url: `https://www.unicode.org/Public/${version}`,
    mappedUcdVersion: null,
    type: "stable" as const,
  }));
}

describe("bootstrap", () => {
  it("should create manifest with valid versions", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const manifestPath = "/test/.ucd-store.json";
    const versions = ["16.0.0", "15.1.0"];

    // create base path first
    await fs.mkdir!(basePath);

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0", "15.0.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, MOCK_CONFIG);

    await bootstrap({ client, fs, basePath, versions, manifestPath });

    const manifest = await readManifest(fs, manifestPath);
    expect(Object.keys(manifest).sort()).toEqual(["15.1.0", "16.0.0"]);
  });

  it("should create base directory when it doesn't exist", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test/nested/path";
    const manifestPath = "/test/nested/path/.ucd-store.json";
    const versions = ["16.0.0"];

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, MOCK_CONFIG);

    await bootstrap({ client, fs, basePath, versions, manifestPath });

    // verify base path exists
    const exists = await fs.exists(basePath);
    expect(exists).toBe(true);

    // verify manifest was created
    const manifest = await readManifest(fs, manifestPath);
    expect(Object.keys(manifest)).toEqual(["16.0.0"]);
  });

  it("should not create directory when base path already exists", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const manifestPath = "/test/.ucd-store.json";
    const versions = ["16.0.0"];

    // pre-create base path
    await fs.mkdir!(basePath);

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, MOCK_CONFIG);

    await expect(
      bootstrap({ client, fs, basePath, versions, manifestPath }),
    ).resolves.not.toThrow();

    const manifest = await readManifest(fs, manifestPath);
    expect(Object.keys(manifest)).toEqual(["16.0.0"]);
  });

  it("should handle empty versions array", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const manifestPath = "/test/.ucd-store.json";
    const versions: string[] = [];

    await fs.mkdir!(basePath);

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, MOCK_CONFIG);

    await bootstrap({ client, fs, basePath, versions, manifestPath });

    const manifest = await readManifest(fs, manifestPath);
    expect(manifest).toEqual({});
  });

  it("should throw error when API request fails", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const manifestPath = "/test/.ucd-store.json";
    const versions = ["16.0.0"];

    await fs.mkdir!(basePath);

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return new HttpResponse(null, { status: 500 });
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, MOCK_CONFIG);

    await expect(
      bootstrap({ client, fs, basePath, versions, manifestPath }),
    ).rejects.toThrow(UCDStoreGenericError);

    await expect(
      bootstrap({ client, fs, basePath, versions, manifestPath }),
    ).rejects.toThrow("Failed to fetch Unicode versions");
  });

  it("should throw error when API returns no data", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const manifestPath = "/test/.ucd-store.json";
    const versions = ["16.0.0"];

    await fs.mkdir!(basePath);

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(null);
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, MOCK_CONFIG);

    await expect(
      bootstrap({ client, fs, basePath, versions, manifestPath }),
    ).rejects.toThrow(UCDStoreGenericError);

    await expect(
      bootstrap({ client, fs, basePath, versions, manifestPath }),
    ).rejects.toThrow("Failed to fetch Unicode versions: no data returned");
  });

  it("should throw error when requested versions are not available in API", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const manifestPath = "/test/.ucd-store.json";
    const versions = ["16.0.0", "99.0.0", "88.0.0"];

    await fs.mkdir!(basePath);

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, MOCK_CONFIG);

    await expect(
      bootstrap({ client, fs, basePath, versions, manifestPath }),
    ).rejects.toThrow(UCDStoreGenericError);

    await expect(
      bootstrap({ client, fs, basePath, versions, manifestPath }),
    ).rejects.toThrow("Some requested versions are not available in the API: 99.0.0, 88.0.0");
  });

  it("should write manifest with correct structure", async () => {
    const fs = createMemoryMockFS();
    const basePath = "/test";
    const manifestPath = "/test/.ucd-store.json";
    const versions = ["16.0.0", "15.1.0", "15.0.0"];

    await fs.mkdir!(basePath);

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0", "15.0.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, MOCK_CONFIG);

    await bootstrap({ client, fs, basePath, versions, manifestPath });

    const manifest = await readManifest(fs, manifestPath);

    // each key should map to itself
    for (const version of versions) {
      expect(manifest[version]).toBe(version);
    }
  });

  it("should throw error when filesystem lacks mkdir capability", async () => {
    const fs = defineFileSystemBridge({
      name: "No-Mkdir Bridge",
      description: "Bridge without mkdir capability",
      setup() {
        return {
          async read() {
            return "";
          },
          async exists() {
            return false;
          },
          async listdir() {
            return [];
          },
          async write() {},
        };
      },
    })();

    const basePath = "/test";
    const manifestPath = "/test/.ucd-store.json";
    const versions = ["16.0.0"];

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, MOCK_CONFIG);

    await expect(
      bootstrap({ client, fs, basePath, versions, manifestPath }),
    ).rejects.toThrow("File system bridge does not support the 'mkdir' capability.");
  });
});
