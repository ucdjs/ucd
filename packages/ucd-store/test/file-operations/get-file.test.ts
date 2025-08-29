import { setupMockStore } from "#internal/test-utils/store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createNodeUCDStore } from "../../src/factory";

describe("get file", () => {
  beforeEach(() => {
    setupMockStore({
      baseUrl: UCDJS_API_BASE_URL,
      responses: {
        "/api/v1/versions": [...UNICODE_VERSION_METADATA],
      },
    });

    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    {
      name: "relative path to root file",
      structure: { "file.txt": "File content" },
      path: "./file.txt",
      expected: "File content",
    },
    {
      name: "relative path to nested file",
      structure: { nested: { "file.txt": "Nested file content" } },
      path: "./nested/file.txt",
      expected: "Nested file content",
    },
  ])("should get file content using $name", async ({ structure, path, expected }) => {
    const storePath = await testdir({
      "15.0.0": structure,
      ".ucd-store.json": JSON.stringify({
        "15.0.0": "15.0.0",
      }),
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
    });

    await store.init();
    const [content, contentError] = await store.getFile("15.0.0", path);
    assert(contentError === null, "Expected getFile to succeed");
    expect(content).toBe(expected);
  });

  it("should be able to get file using full system path", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "file.txt": "Full path content",
      },
      ".ucd-store.json": JSON.stringify({
        "15.0.0": "15.0.0",
      }),
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
    });

    await store.init();
    const [content, contentError] = await store.getFile("15.0.0", `${storePath}/15.0.0/file.txt`);
    assert(contentError === null, "Expected getFile to succeed");
    expect(content).toBe("Full path content");
  });

  it("should throw error for invalid file", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "file.txt": "File content",
      },
      ".ucd-store.json": JSON.stringify({
        "15.0.0": "15.0.0",
      }),
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
    });

    await store.init();
    const [fileData, fileError] = await store.getFile("15.0.0", "./nonexistent.txt");
    expect(fileData).toBe(null);
    assert(fileError != null, "Expected error for nonexistent file");
    expect(fileError.message).toBe("File not found: ./nonexistent.txt in version 15.0.0");
  });

  it.todo("should disallow reading files outside the store", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "file.txt": "Store file content",
      },
      ".ucd-store.json": JSON.stringify({
        "15.0.0": "15.0.0",
      }),
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
    });

    await store.init();
    const [fileData, fileError] = await store.getFile("15.0.0", "../../outside.txt");
    expect(fileData).toBe(null);
    assert(fileError != null, "Expected error for path traversal");
    expect(fileError.message).toBe("Path traversal detected: ../outside.txt resolves outside base directory");
  });
});
