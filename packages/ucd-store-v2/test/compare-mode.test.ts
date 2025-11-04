import type { ComparisonMode } from "../src/operations/compare";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../src/core/context";
import { resolveComparisonMode } from "../src/operations/compare";

describe("resolveComparisonMode", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());
  const filter = createPathFilter({});

  describe("auto-detection mode", () => {
    it("should return local-local when both versions exist locally", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/file.txt": "content",
          "/test/15.1.0/file.txt": "content",
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

      const mode = await resolveComparisonMode({
        context,
        fromVersion: "16.0.0",
        toVersion: "15.1.0",
        allowApi: false,
      });

      expect(mode).toEqual({
        type: "local-local",
        fromLocal: true,
        toLocal: true,
      } satisfies ComparisonMode);
    });

    it("should return local-api when from is local and to needs API", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.1.0/file.txt": "content",
          // 16.0.0 doesn't exist locally
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["15.1.0"], // Only 15.1.0 in manifest
        manifestPath: "/test/.ucd-store.json",
      });

      const mode = await resolveComparisonMode({
        context,
        fromVersion: "15.1.0",
        toVersion: "16.0.0",
        allowApi: true,
      });

      expect(mode).toEqual({
        type: "local-api",
        fromLocal: true,
        toLocal: false,
      } satisfies ComparisonMode);
    });

    it("should return api-local when from needs API and to is local", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/file.txt": "content",
          // 15.1.0 doesn't exist locally
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"], // Only 16.0.0 in manifest
        manifestPath: "/test/.ucd-store.json",
      });

      const mode = await resolveComparisonMode({
        context,
        fromVersion: "15.1.0",
        toVersion: "16.0.0",
        allowApi: true,
      });

      expect(mode).toEqual({
        type: "api-local",
        fromLocal: false,
        toLocal: true,
      } satisfies ComparisonMode);
    });

    it("should return api-api when neither version exists locally", async () => {
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
        versions: [], // No versions in manifest
        manifestPath: "/test/.ucd-store.json",
      });

      const mode = await resolveComparisonMode({
        context,
        fromVersion: "16.0.0",
        toVersion: "15.1.0",
        allowApi: true,
      });

      expect(mode).toEqual({
        type: "api-api",
        fromLocal: false,
        toLocal: false,
      } satisfies ComparisonMode);
    });

    it("should throw error when from version not local and allowApi is false", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/file.txt": "content",
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

      await expect(
        resolveComparisonMode({
          context,
          fromVersion: "15.1.0",
          toVersion: "16.0.0",
          allowApi: false,
        }),
      ).rejects.toThrow("Version '15.1.0' does not exist in the store.");
    });

    it("should throw error when to version not local and allowApi is false", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.1.0/file.txt": "content",
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

      await expect(
        resolveComparisonMode({
          context,
          fromVersion: "15.1.0",
          toVersion: "16.0.0",
          allowApi: false,
        }),
      ).rejects.toThrow("Version '16.0.0' does not exist in the store.");
    });

    it("should handle version in manifest but directory doesn't exist", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/file.txt": "content",
          // 15.1.0 is in manifest but directory doesn't exist
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0", "15.1.0"], // Both in manifest
        manifestPath: "/test/.ucd-store.json",
      });

      const mode = await resolveComparisonMode({
        context,
        fromVersion: "16.0.0",
        toVersion: "15.1.0",
        allowApi: true,
      });

      // Should be local-api because 15.1.0 directory doesn't exist
      expect(mode).toEqual({
        type: "local-api",
        fromLocal: true,
        toLocal: false,
      } satisfies ComparisonMode);
    });

    it("should check both manifest and directory existence", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/file.txt": "content",
          "/test/99.0.0/file.txt": "orphaned version not in manifest",
        },
      });

      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"], // 99.0.0 exists on disk but not in manifest
        manifestPath: "/test/.ucd-store.json",
      });

      const mode = await resolveComparisonMode({
        context,
        fromVersion: "16.0.0",
        toVersion: "99.0.0",
        allowApi: true,
      });

      // Should be local-api because 99.0.0 not in manifest
      expect(mode).toEqual({
        type: "local-api",
        fromLocal: true,
        toLocal: false,
      } satisfies ComparisonMode);
    });

    it("should handle comparing version to itself", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/file.txt": "content",
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

      const mode = await resolveComparisonMode({
        context,
        fromVersion: "16.0.0",
        toVersion: "16.0.0",
        allowApi: false,
      });

      expect(mode).toEqual({
        type: "local-local",
        fromLocal: true,
        toLocal: true,
      } satisfies ComparisonMode);
    });
  });

  describe("manual mode validation", () => {
    it("should accept valid local-local mode", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/file.txt": "content",
          "/test/15.1.0/file.txt": "content",
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

      const mode = await resolveComparisonMode({
        context,
        fromVersion: "16.0.0",
        toVersion: "15.1.0",
        allowApi: false,
        manualMode: "local-local",
      });

      expect(mode).toEqual({
        type: "local-local",
        fromLocal: true,
        toLocal: true,
      } satisfies ComparisonMode);
    });

    it("should accept valid api-api mode", async () => {
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

      const mode = await resolveComparisonMode({
        context,
        fromVersion: "16.0.0",
        toVersion: "15.1.0",
        allowApi: true,
        manualMode: "api-api",
      });

      expect(mode).toEqual({
        type: "api-api",
        fromLocal: false,
        toLocal: false,
      } satisfies ComparisonMode);
    });

    it("should throw error when local-local mode but from version not local", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/file.txt": "content",
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

      await expect(
        resolveComparisonMode({
          context,
          fromVersion: "15.1.0",
          toVersion: "16.0.0",
          allowApi: false,
          manualMode: "local-local",
        }),
      ).rejects.toThrow("Cannot use mode 'local-local': 'from' version '15.1.0' is not available locally");
    });

    it("should throw error when local-local mode but to version not local", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.1.0/file.txt": "content",
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

      await expect(
        resolveComparisonMode({
          context,
          fromVersion: "15.1.0",
          toVersion: "16.0.0",
          allowApi: false,
          manualMode: "local-local",
        }),
      ).rejects.toThrow("Cannot use mode 'local-local': 'to' version '16.0.0' is not available locally");
    });

    it("should throw error when mode requires API but allowApi is false", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/15.1.0/file.txt": "content",
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

      await expect(
        resolveComparisonMode({
          context,
          fromVersion: "15.1.0",
          toVersion: "16.0.0",
          allowApi: false,
          manualMode: "local-api",
        }),
      ).rejects.toThrow("Cannot use mode 'local-api': requires API access but allowApi is false");
    });

    it("should throw error when local-api mode but from version not local", async () => {
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

      await expect(
        resolveComparisonMode({
          context,
          fromVersion: "15.1.0",
          toVersion: "16.0.0",
          allowApi: true,
          manualMode: "local-api",
        }),
      ).rejects.toThrow("Cannot use mode 'local-api': 'from' version '15.1.0' is not available locally");
    });

    it("should throw error when api-local mode but to version not local", async () => {
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

      await expect(
        resolveComparisonMode({
          context,
          fromVersion: "15.1.0",
          toVersion: "16.0.0",
          allowApi: true,
          manualMode: "api-local",
        }),
      ).rejects.toThrow("Cannot use mode 'api-local': 'to' version '16.0.0' is not available locally");
    });

    it("should allow api-api mode even when files exist locally", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "/test/16.0.0/file.txt": "content",
          "/test/15.1.0/file.txt": "content",
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

      const mode = await resolveComparisonMode({
        context,
        fromVersion: "16.0.0",
        toVersion: "15.1.0",
        allowApi: true,
        manualMode: "api-api",
      });

      expect(mode).toEqual({
        type: "api-api",
        fromLocal: false,
        toLocal: false,
      } satisfies ComparisonMode);
    });
  });
});
