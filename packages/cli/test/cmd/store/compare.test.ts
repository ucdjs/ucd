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

    expect(capture.containsInfo("Compare Two Versions in UCD Store")).toBe(true);
    expect(capture.containsInfo("from")).toBe(true);
    expect(capture.containsInfo("to")).toBe(true);
    expect(capture.containsInfo("--skip-hashes")).toBe(true);
    expect(capture.containsInfo("--concurrency")).toBe(true);
    expect(capture.containsInfo("--json")).toBe(true);
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

    expect(capture.containsInfo("Comparison: 15.0.0 → 16.0.0")).toBe(true);
    expect(capture.containsInfo("Files:")).toBe(true);
    expect(capture.containsInfo("Unchanged:")).toBe(true);
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

    expect(capture.containsInfo("Added: 1")).toBe(true);
    expect(capture.contains("Blocks.txt")).toBe(true);
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

    expect(capture.containsInfo("Removed: 1")).toBe(true);
    expect(capture.contains("Blocks.txt")).toBe(true);
  });

  it("should detect modified files when comparing versions with hash checking", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
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

    expect(capture.containsInfo("Modified: 1")).toBe(true);
  });

  it("should output JSON when --json flag is passed", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
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
      files: Record<string, string[]>;
      counts: Record<string, number>;
    }>();
    expect(json).toBeDefined();
    expect(json?.from).toBe("15.0.0");
    expect(json?.to).toBe("16.0.0");
    expect(json?.files).toHaveProperty("added");
    expect(json?.files).toHaveProperty("removed");
    expect(json?.files).toHaveProperty("modified");
    expect(json?.files).toHaveProperty("unchanged");
    expect(json?.counts).toHaveProperty("added");
    expect(json?.counts).toHaveProperty("removed");
    expect(json?.counts).toHaveProperty("modified");
    expect(json?.counts).toHaveProperty("unchanged");
  });
});
