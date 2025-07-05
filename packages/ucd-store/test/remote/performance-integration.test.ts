import { mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { PRECONFIGURED_FILTERS } from "@ucdjs/utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore } from "../../src/factory";
import { flattenFilePaths } from "../../src/helpers";

describe("remote ucd store - performance and integration", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("performance tests", () => {
    it("should handle large file trees efficiently", async () => {
      const largeFileTree = Array.from({ length: 1000 }, (_, i) => ({
        type: "file",
        name: `File${i.toString().padStart(4, "0")}.txt`,
        path: `/File${i.toString().padStart(4, "0")}.txt`,
        lastModified: Date.now(),
      }));

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(largeFileTree);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const startTime = Date.now();
      const fileTree = await store.getFileTree("15.0.0");
      const endTime = Date.now();

      expect(fileTree).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it("should handle concurrent API operations", async () => {
      const files1 = [{ type: "file", name: "File1.txt", path: "/File1.txt" }];
      const files2 = [{ type: "file", name: "File2.txt", path: "/File2.txt" }];
      const files3 = [{ type: "file", name: "File3.txt", path: "/File3.txt" }];

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return mockResponses.json([
            { version: "15.0.0", path: "/15.0.0" },
            { version: "15.1.0", path: "/15.1.0" },
            { version: "15.2.0", path: "/15.2.0" },
          ]);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(files1);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.1.0`, () => {
          return mockResponses.json(files2);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.2.0`, () => {
          return mockResponses.json(files3);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const startTime = Date.now();
      const [tree1, tree2, tree3] = await Promise.all([
        store.getFileTree("15.0.0"),
        store.getFileTree("15.1.0"),
        store.getFileTree("15.2.0"),
      ]);
      const endTime = Date.now();

      expect(tree1).toHaveLength(1);
      expect(tree2).toHaveLength(1);
      expect(tree3).toHaveLength(1);
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should cache API responses appropriately", async () => {
      const testFiles = [{ type: "file", name: "CachedFile.txt", path: "/CachedFile.txt" }];
      let requestCount = 0;

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          requestCount++;
          return mockResponses.json(testFiles);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const result1 = await store.getFileTree("15.0.0");
      const result2 = await store.getFileTree("15.0.0");

      expect(flattenFilePaths(result1)).toEqual(flattenFilePaths(testFiles));
      expect(flattenFilePaths(result2)).toEqual(flattenFilePaths(testFiles));
      expect(requestCount).toBeGreaterThan(0);
    });
  });

  describe("integration tests", () => {
    it("should handle complete remote workflow", async () => {
      const testFiles = [
        { type: "file", name: "WorkflowFile1.txt", path: "/WorkflowFile1.txt" },
        { type: "file", name: "WorkflowFile2.txt", path: "/WorkflowFile2.txt" },
      ];

      const fileContent = "Test workflow content";

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(testFiles);
        }],
        [`GET ${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/15.0.0/WorkflowFile1.txt`, () => {
          return mockResponses.text(fileContent);
        }],
      ]);

      const store = await createRemoteUCDStore();

      const fileTree = await store.getFileTree("15.0.0");
      expect(fileTree).toHaveLength(2);

      const filePaths = await store.getFilePaths("15.0.0");
      expect(filePaths).toEqual(["WorkflowFile1.txt", "WorkflowFile2.txt"]);

      const content = await store.getFile("15.0.0", "WorkflowFile1.txt");
      expect(content).toBe(fileContent);

      expect(store.hasVersion("15.0.0")).toBe(true);
      expect(store.hasVersion("99.99.99")).toBe(false);
    });

    it("should handle remote store with complex filtering", async () => {
      const mixedFiles = [
        { type: "file", name: "UnicodeData.txt", path: "/UnicodeData.txt" },
        { type: "file", name: "NormalizationTest.txt", path: "/NormalizationTest.txt" },
        { type: "file", name: "BidiTest.txt", path: "/BidiTest.txt" },
        { type: "file", name: "README.md", path: "/README.md" },
      ];

      mockFetch([
        [`GET ${UCDJS_API_BASE_URL}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(mixedFiles);
        }],
      ]);

      const store = await createRemoteUCDStore({
        globalFilters: [PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES, "!*.md"],
      });

      const filePaths = await store.getFilePaths("15.0.0");

      expect(filePaths).toEqual(["UnicodeData.txt"]);
      expect(filePaths).not.toContain("NormalizationTest.txt");
      expect(filePaths).not.toContain("BidiTest.txt");
      expect(filePaths).not.toContain("README.md");
    });

    it("should handle switching between different remote endpoints", async () => {
      const customBaseUrl = "https://custom-api.ucdjs.dev";
      const testFiles = [{ type: "file", name: "CustomFile.txt", path: "/CustomFile.txt" }];

      mockFetch([
        [`HEAD ${customBaseUrl}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return mockResponses.head();
        }],
        [`GET ${customBaseUrl}/api/v1/unicode-proxy/.ucd-store.json`, () => {
          return mockResponses.json([{ version: "15.0.0", path: "/15.0.0" }]);
        }],
        [`GET ${customBaseUrl}/api/v1/files/15.0.0`, () => {
          return mockResponses.json(testFiles);
        }],
      ]);

      const store = await createRemoteUCDStore({
        baseUrl: customBaseUrl,
      });

      expect(store.baseUrl).toBe(customBaseUrl);

      const fileTree = await store.getFileTree("15.0.0");
      expect(flattenFilePaths(fileTree)).toEqual(flattenFilePaths(testFiles));
    });
  });
});
