import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError } from "../src/errors";
import { createUCDStore } from "../src/store";

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

describe("createUCDStore", () => {
  describe("new store (no manifest)", () => {
    it("should bootstrap and create store when no manifest exists", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: MOCK_CONFIG,
      });

      expect(store).toBeDefined();
      expect(store.versions).toEqual(["16.0.0"]);
      expect(store.basePath).toBe(basePath);
      expect(store.fs).toBe(fs);
    });

    it("should throw error when no manifest exists and bootstrap is disabled", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      await expect(
        createUCDStore({
          fs,
          basePath,
          versions: ["16.0.0"],
          bootstrap: false,
          endpointConfig: MOCK_CONFIG,
        }),
      ).rejects.toThrow(UCDStoreGenericError);

      await expect(
        createUCDStore({
          fs,
          basePath,
          versions: ["16.0.0"],
          bootstrap: false,
          endpointConfig: MOCK_CONFIG,
        }),
      ).rejects.toThrow("Store manifest not found");
    });

    it("should validate versions during bootstrap", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
        }],
      ]);

      await expect(
        createUCDStore({
          fs,
          basePath,
          versions: ["99.0.0"],
          endpointConfig: MOCK_CONFIG,
        }),
      ).rejects.toThrow(UCDStoreGenericError);

      await expect(
        createUCDStore({
          fs,
          basePath,
          versions: ["99.0.0"],
          endpointConfig: MOCK_CONFIG,
        }),
      ).rejects.toThrow("not available in the API");
    });

    it("should create manifest at correct path", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
        }],
      ]);

      await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: MOCK_CONFIG,
      });

      const manifestExists = await fs.exists("/test/.ucd-store.json");
      expect(manifestExists).toBe(true);
    });
  });

  describe("existing store (manifest exists)", () => {
    it("should load versions from manifest when no versions provided", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";
      const manifestPath = "/test/.ucd-store.json";

      await fs.write!(manifestPath, JSON.stringify({
        "16.0.0": "16.0.0",
        "15.1.0": "15.1.0",
      }));

      const store = await createUCDStore({
        fs,
        basePath,
        endpointConfig: MOCK_CONFIG,
      });

      expect(store.versions).toContain("16.0.0");
      expect(store.versions).toContain("15.1.0");
      expect(store.versions).toHaveLength(2);
    });

    it("should use strict strategy by default when versions provided", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";
      const manifestPath = "/test/.ucd-store.json";

      await fs.write!(manifestPath, JSON.stringify({
        "16.0.0": "16.0.0",
      }));

      await expect(
        createUCDStore({
          fs,
          basePath,
          versions: ["15.1.0"],
          endpointConfig: MOCK_CONFIG,
        }),
      ).rejects.toThrow(UCDStoreGenericError);

      await expect(
        createUCDStore({
          fs,
          basePath,
          versions: ["15.1.0"],
          endpointConfig: MOCK_CONFIG,
        }),
      ).rejects.toThrow("Version mismatch");
    });

    it("should merge versions with merge strategy", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";
      const manifestPath = "/test/.ucd-store.json";

      await fs.write!(manifestPath, JSON.stringify({
        "16.0.0": "16.0.0",
      }));

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["15.1.0"],
        versionStrategy: "merge",
        endpointConfig: MOCK_CONFIG,
      });

      expect(store.versions).toContain("16.0.0");
      expect(store.versions).toContain("15.1.0");
      expect(store.versions).toHaveLength(2);
    });

    it("should overwrite versions with overwrite strategy", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";
      const manifestPath = "/test/.ucd-store.json";

      await fs.write!(manifestPath, JSON.stringify({
        "16.0.0": "16.0.0",
      }));

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["15.1.0", "15.0.0"],
        versionStrategy: "overwrite",
        endpointConfig: MOCK_CONFIG,
      });

      expect(store.versions).toEqual(["15.1.0", "15.0.0"]);
      expect(store.versions).not.toContain("16.0.0");
    });

    it("should verify manifest when verify option enabled", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";
      const manifestPath = "/test/.ucd-store.json";

      await fs.write!(manifestPath, JSON.stringify({
        "16.0.0": "16.0.0",
        "15.1.0": "15.1.0",
      }));

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0", "15.0.0"]));
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        verify: true,
        endpointConfig: MOCK_CONFIG,
      });

      expect(store).toBeDefined();
      expect(store.versions).toContain("16.0.0");
      expect(store.versions).toContain("15.1.0");
    });

    it("should throw error when verification fails", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";
      const manifestPath = "/test/.ucd-store.json";

      await fs.write!(manifestPath, JSON.stringify({
        "99.0.0": "99.0.0",
      }));

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
        }],
      ]);

      await expect(
        createUCDStore({
          fs,
          basePath,
          verify: true,
          endpointConfig: MOCK_CONFIG,
        }),
      ).rejects.toThrow(UCDStoreGenericError);

      await expect(
        createUCDStore({
          fs,
          basePath,
          verify: true,
          endpointConfig: MOCK_CONFIG,
        }),
      ).rejects.toThrow("Manifest verification failed");
    });
  });

  describe("configuration", () => {
    it("should use default baseUrl when not provided", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(MOCK_CONFIG);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0"]));
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
      });

      expect(store).toBeDefined();
    });

    it("should use custom baseUrl when provided", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";
      const customBaseUrl = "https://custom.api.dev";

      mockFetch([
        ["GET", `${customBaseUrl}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(MOCK_CONFIG);
        }],
        ["GET", `${customBaseUrl}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0"]));
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        baseUrl: customBaseUrl,
        versions: ["16.0.0"],
      });

      expect(store).toBeDefined();
    });

    it("should discover endpoint config when not provided", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/.well-known/ucd-config.json`, () => {
          return HttpResponse.json(MOCK_CONFIG);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0"]));
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
      });

      expect(store).toBeDefined();
    });

    it("should use provided endpoint config", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0"]));
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: MOCK_CONFIG,
      });

      expect(store).toBeDefined();
    });

    it("should use provided client instead of creating one", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0"]));
        }],
      ]);

      const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, MOCK_CONFIG);

      const store = await createUCDStore({
        fs,
        basePath,
        client,
        versions: ["16.0.0"],
      });

      expect(store).toBeDefined();
    });

    it("should create path filter from globalFilters", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0"]));
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        globalFilters: {
          include: ["**/*.txt"],
          exclude: ["**/test/**"],
        },
        endpointConfig: MOCK_CONFIG,
      });

      expect(store).toBeDefined();
    });
  });

  describe("context and return value", () => {
    it("should return store with correct context properties", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test/store";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0"]));
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: MOCK_CONFIG,
      });

      expect(store.basePath).toBe(basePath);
      expect(store.fs).toBe(fs);
      expect(store.versions).toEqual(["16.0.0"]);
    });

    it("should return store with methods", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0"]));
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: MOCK_CONFIG,
      });

      expect(store.getFileTree).toBeDefined();
      expect(store.getFilePaths).toBeDefined();
      expect(store.getFile).toBeDefined();
    });

    it("should return store with operations", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0"]));
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: MOCK_CONFIG,
      });

      expect(store.analyze).toBeDefined();
    });

    it("should expose frozen versions array", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0", "15.1.0"],
        endpointConfig: MOCK_CONFIG,
      });

      expect(Object.isFrozen(store.versions)).toBe(true);
    });
  });
});
