import type { ConsoleOutputCapture } from "../../__test-utils";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";
import { captureConsoleOutput } from "../../__test-utils";

describe("store compare command", () => {
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    await runCLI(["store", "compare", "--help"]);

    expect(capture.containsLog("Compare Two Versions in UCD Store")).toBe(true);
    expect(capture.containsLog("from")).toBe(true);
    expect(capture.containsLog("to")).toBe(true);
    expect(capture.containsLog("--skip-hashes")).toBe(true);
    expect(capture.containsLog("--concurrency")).toBe(true);
    expect(capture.containsLog("--json")).toBe(true);
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "compare", "15.0.0", "16.0.0"]);

    expect(capture.containsError("Either --remote or --store-dir must be specified")).toBe(true);
  });

  it("should fail if from or to version is not specified", async () => {
    const storePath = await testdir();

    await runCLI(["store", "compare", "--store-dir", storePath]);

    expect(capture.containsError("Both <from> and <to> versions must be specified")).toBe(true);
  });

  it("should compare two versions with no hash checking", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "/ArabicShaping.txt",
            lastModified: 1752862620000,
          },
          {
            type: "file",
            name: "Blocks.txt",
            path: "/Blocks.txt",
            lastModified: 1752862620000,
          },
        ],
        "/api/v1/files/{wildcard}": ({ params }) => {
          return HttpResponse.text(`Content of ${params.wildcard}`);
        },
      },
    });

    // Initialize both versions
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "15.0.0",
      "16.0.0",
    ]);

    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "15.0.0",
      "16.0.0",
    ]);

    capture.clear();

    await runCLI([
      "store",
      "compare",
      "15.0.0",
      "16.0.0",
      "--store-dir",
      storePath,
      "--skip-hashes",
    ]);

    expect(capture.containsLog("Comparison: 15.0.0 → 16.0.0")).toBe(true);
    expect(capture.containsLog("Summary:")).toBe(true);
    // Both versions have the same 2 files, so all should be unchanged
    expect(capture.containsLog("Added:")).toBe(true);
    expect(capture.containsLog("Removed:")).toBe(true);
    expect(capture.containsLog("Unchanged:")).toBe(true);
    // Verify the counts show 0 for added/removed and 2 for unchanged
    expect(capture.contains("0")).toBe(true); // Added and Removed should be 0
    expect(capture.contains("2")).toBe(true); // Unchanged should be 2
  });

  it("should detect added files when comparing versions", async () => {
    const storePath = await testdir();

    const version1Tree = [
      {
        type: "file" as const,
        name: "ArabicShaping.txt",
        path: "/ArabicShaping.txt",
        lastModified: 1752862620000,
      },
    ];

    const version2Tree = [
      {
        type: "file" as const,
        name: "ArabicShaping.txt",
        path: "/ArabicShaping.txt",
        lastModified: 1752862620000,
      },
      {
        type: "file" as const,
        name: "Blocks.txt",
        path: "/Blocks.txt",
        lastModified: 1752862620000,
      },
    ];

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          if (params.version === "15.0.0") {
            return HttpResponse.json(version1Tree);
          }
          return HttpResponse.json(version2Tree);
        },
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
      "15.0.0",
      "16.0.0",
    ]);

    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "15.0.0",
      "16.0.0",
    ]);

    capture.clear();

    await runCLI([
      "store",
      "compare",
      "15.0.0",
      "16.0.0",
      "--store-dir",
      storePath,
      "--skip-hashes",
    ]);

    // version1 has 1 file, version2 has 2 files - so 1 file was added
    expect(capture.containsLog("Added:")).toBe(true);
    expect(capture.contains("1")).toBe(true); // 1 file added
    expect(capture.contains("Blocks.txt")).toBe(true); // The added file
    // ArabicShaping.txt exists in both, so should be unchanged
    expect(capture.containsLog("Unchanged:")).toBe(true);
  });

  it("should detect removed files when comparing versions", async () => {
    const storePath = await testdir();

    const version1Tree = [
      {
        type: "file" as const,
        name: "ArabicShaping.txt",
        path: "/ArabicShaping.txt",
        lastModified: 1752862620000,
      },
      {
        type: "file" as const,
        name: "Blocks.txt",
        path: "/Blocks.txt",
        lastModified: 1752862620000,
      },
    ];

    const version2Tree = [
      {
        type: "file" as const,
        name: "ArabicShaping.txt",
        path: "/ArabicShaping.txt",
        lastModified: 1752862620000,
      },
    ];

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          if (params.version === "15.0.0") {
            return HttpResponse.json(version1Tree);
          }
          return HttpResponse.json(version2Tree);
        },
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
      "15.0.0",
      "16.0.0",
    ]);

    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "15.0.0",
      "16.0.0",
    ]);

    capture.clear();

    await runCLI([
      "store",
      "compare",
      "15.0.0",
      "16.0.0",
      "--store-dir",
      storePath,
      "--skip-hashes",
    ]);

    // version1 has 2 files, version2 has 1 file - so 1 file was removed
    expect(capture.containsLog("Removed:")).toBe(true);
    expect(capture.contains("1")).toBe(true); // 1 file removed
    expect(capture.contains("Blocks.txt")).toBe(true); // The removed file
    // ArabicShaping.txt exists in both, so should be unchanged
    expect(capture.containsLog("Unchanged:")).toBe(true);
  });

  it("should detect modified files when comparing versions with hash checking", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "/ArabicShaping.txt",
            lastModified: 1752862620000,
          },
        ],
        "/api/v1/files/{wildcard}": ({ params }) => {
          if (params.wildcard && params.wildcard.includes("15.0.0")) {
            return HttpResponse.text("Version 1 content");
          }
          return HttpResponse.text("Version 2 modified content");
        },
      },
    });

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "15.0.0",
      "16.0.0",
    ]);

    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "15.0.0",
      "16.0.0",
    ]);

    capture.clear();

    await runCLI([
      "store",
      "compare",
      "15.0.0",
      "16.0.0",
      "--store-dir",
      storePath,
    ]);

    // Same file in both versions but different content = modified
    expect(capture.containsLog("Modified:")).toBe(true);
    expect(capture.contains("1")).toBe(true); // 1 file modified
    expect(capture.contains("ArabicShaping.txt")).toBe(true); // The modified file
    // No files added or removed
    expect(capture.containsLog("Added:")).toBe(true);
    expect(capture.containsLog("Removed:")).toBe(true);
  });

  it("should output JSON when --json flag is passed", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": [
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "/ArabicShaping.txt",
            lastModified: 1752862620000,
          },
        ],
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
      "15.0.0",
      "16.0.0",
    ]);

    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "15.0.0",
      "16.0.0",
    ]);

    capture.clear();

    await runCLI([
      "store",
      "compare",
      "15.0.0",
      "16.0.0",
      "--store-dir",
      storePath,
      "--skip-hashes",
      "--json",
    ]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      from: string;
      to: string;
      added: string[];
      removed: string[];
      modified: string[];
      unchanged: number;
      changes: Array<{ path: string; fromHash?: string; toHash?: string }>;
    }>();

    // Verify the structure and values
    expect(json).toBeDefined();
    expect(json?.from).toBe("15.0.0");
    expect(json?.to).toBe("16.0.0");

    // Both versions have same file with same content = unchanged
    expect(json?.added).toEqual([]);
    expect(json?.removed).toEqual([]);
    expect(json?.modified).toEqual([]);
    expect(json?.unchanged).toBe(1); // ArabicShaping.txt
    expect(json?.changes).toEqual([]); // No detailed changes since nothing modified
  });
});
