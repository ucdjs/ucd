import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";

describe("store mirror command", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should show help when --help flag is passed", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runCLI(["store", "mirror", "--help"]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Mirror Unicode data files to local storage");
    expect(output).toContain("--store-dir");
    expect(output).toContain("--concurrency");
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "mirror"]);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Either --remote or --store-dir must be specified");
  });

  it("should fail if --remote is specified (mirror requires local store)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "mirror", "--remote"]);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Mirror operation requires a local store directory");
  });

  it("should mirror specific versions", async () => {
    // First, initialize a store with a lockfile
    const storePath = await testdir();
    const consoleInfoSpy = vi.spyOn(console, "info");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": [{
          type: "file",
          name: "ArabicShaping.txt",
          path: "/ArabicShaping.txt",
          lastModified: 1752862620000,
        }, {
          type: "file",
          name: "BidiBrackets.txt",
          path: "/BidiBrackets.txt",
          lastModified: 1752862620000,
        }],
        "/api/v1/files/{wildcard}": ({ params }) => {
          return HttpResponse.text(`Content of ${params.wildcard}`);
        },
      },
    });

    // Initialize the store first
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    consoleInfoSpy.mockClear();

    // Then run mirror with specific versions
    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Starting mirror operation");
    expect(infoOutput).toContain("Mirroring 1 version(s)");
    expect(infoOutput).toContain("Mirror operation completed successfully");
  });

  it("should mirror all versions when none specified", async () => {
    const storePath = await testdir();
    const consoleInfoSpy = vi.spyOn(console, "info");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": [{
          type: "file",
          name: "ArabicShaping.txt",
          path: "/ArabicShaping.txt",
          lastModified: 1752862620000,
        }],
        "/api/v1/files/{wildcard}": ({ params }) => {
          return HttpResponse.text(`Content of ${params.wildcard}`);
        },
      },
    });

    // Initialize with multiple versions
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
      "15.1.0",
    ]);

    consoleInfoSpy.mockClear();

    // Mirror without specifying versions
    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Starting mirror operation");
    expect(infoOutput).toContain("Mirroring all versions in lockfile");
    expect(infoOutput).toContain("Mirror operation completed successfully");
  });

  it("should create version directories and files", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": [{
          type: "file",
          name: "UnicodeData.txt",
          path: "/UnicodeData.txt",
          lastModified: 1752862620000,
        }],
        "/api/v1/files/{wildcard}": ({ params }) => {
          return HttpResponse.text(`Content of ${params.wildcard}`);
        },
      },
    });

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    // Check that the version directory exists
    expect(existsSync(join(storePath, "16.0.0"))).toBe(true);

    // Check that the file was created
    expect(existsSync(join(storePath, "16.0.0", "UnicodeData.txt"))).toBe(true);

    // Check file content
    const content = readFileSync(join(storePath, "16.0.0", "UnicodeData.txt"), "utf-8");
    expect(content).toContain("Content of");
  });

  it("should display download statistics", async () => {
    const storePath = await testdir();
    const consoleInfoSpy = vi.spyOn(console, "info");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": [{
          type: "file",
          name: "ArabicShaping.txt",
          path: "/ArabicShaping.txt",
          lastModified: 1752862620000,
        }, {
          type: "file",
          name: "BidiBrackets.txt",
          path: "/BidiBrackets.txt",
          lastModified: 1752862620000,
        }],
        "/api/v1/files/{wildcard}": ({ params }) => {
          return HttpResponse.text(`Content of ${params.wildcard}`);
        },
      },
    });

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    // Check for statistics in output
    expect(infoOutput).toContain("Files downloaded:");
    expect(infoOutput).toContain("Files skipped:");
  });

  it("should respect include patterns", async () => {
    const storePath = await testdir();

    mockStoreApi({
      files: {
        "*": [
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "ArabicShaping.txt",
            lastModified: 1752862620000,
          },
          {
            type: "file",
            name: "BidiBrackets.txt",
            path: "BidiBrackets.txt",
            lastModified: 1752862620000,
          },
          {
            type: "file",
            name: "UnicodeData.txt",
            path: "UnicodeData.txt",
            lastModified: 1752862620000,
          },
        ],
      },
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
      "--include",
      "**/Arabic*.txt",
    ]);

    // Check that only the included file exists
    expect(existsSync(join(storePath, "16.0.0", "ArabicShaping.txt"))).toBe(true);
    expect(existsSync(join(storePath, "16.0.0", "BidiBrackets.txt"))).toBe(false);
    expect(existsSync(join(storePath, "16.0.0", "UnicodeData.txt"))).toBe(false);
  });

  it("should respect exclude patterns", async () => {
    const storePath = await testdir();

    mockStoreApi({
      files: {
        "*": [
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "ArabicShaping.txt",
            lastModified: 1752862620000,
          },
          {
            type: "file",
            name: "BidiBrackets.txt",
            path: "BidiBrackets.txt",
            lastModified: 1752862620000,
          },
          {
            type: "file",
            name: "UnicodeData.txt",
            path: "UnicodeData.txt",
            lastModified: 1752862620000,
          },
        ],
      },
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
      "--exclude",
      "**/Bidi*.txt",
    ]);

    // Check that excluded file doesn't exist
    expect(existsSync(join(storePath, "16.0.0", "ArabicShaping.txt"))).toBe(true);
    expect(existsSync(join(storePath, "16.0.0", "BidiBrackets.txt"))).toBe(false);
    expect(existsSync(join(storePath, "16.0.0", "UnicodeData.txt"))).toBe(true);
  });
});
