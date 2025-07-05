import { mockFetch, mockResponses } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { flattenFilePaths } from "@ucdjs/ucd-store";
import { createPathFilter, PRECONFIGURED_FILTERS } from "@ucdjs/utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRemoteUCDStore } from "../../src/store";

// eslint-disable-next-line test/prefer-lowercase-title
describe("Remote UCD Store - Integration Scenarios", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

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

    // Test complete workflow: get file tree, get file paths, get file content
    const fileTree = await store.getFileTree("15.0.0");
    expect(fileTree).toHaveLength(2);

    const filePaths = await store.getFilePaths("15.0.0");
    expect(filePaths).toEqual(["WorkflowFile1.txt", "WorkflowFile2.txt"]);

    const content = await store.getFile("15.0.0", "WorkflowFile1.txt");
    expect(content).toBe(fileContent);

    // Test version checking
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
