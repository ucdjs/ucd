import type { ConsoleOutputCapture } from "../../__test-utils";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";
import { captureConsoleOutput } from "../../__test-utils";

describe("store analyze command", () => {
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    const helpCapture = captureConsoleOutput();
    await runCLI(["store", "analyze", "--help"]);

    expect(helpCapture.contains("Analyze UCD Store")).toBe(true);
    expect(helpCapture.contains("--store-dir")).toBe(true);
    expect(helpCapture.contains("--json")).toBe(true);
    expect(helpCapture.contains("--check-orphaned")).toBe(true);

    helpCapture.restore();
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "analyze"]);

    expect(capture.containsError("Either --remote or --store-dir must be specified")).toBe(true);
  });

  it("should analyze store for a specific version", async () => {
    const storePath = await testdir();

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
          name: "Blocks.txt",
          path: "/Blocks.txt",
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

    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    capture.clear();

    await runCLI([
      "store",
      "analyze",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    expect(capture.containsInfo("Version: 16.0.0")).toBe(true);
    expect(capture.containsInfo("Files:")).toBe(true);
  });

  it("should analyze all versions when no version is specified", async () => {
    const storePath = await testdir();

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

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
      "15.1.0",
    ]);

    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
    ]);

    capture.clear();

    await runCLI([
      "store",
      "analyze",
      "--store-dir",
      storePath,
    ]);

    expect(capture.containsInfo("No specific versions provided")).toBe(true);
  });

  it("should output JSON when --json flag is passed", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": ({ params }) => {
          return HttpResponse.text(`Content of ${params.wildcard}`);
        },
      },
      files: {
        "*": [{
          type: "file",
          name: "ArabicShaping.txt",
          path: "ArabicShaping.txt",
          lastModified: 1752862620000,
        }],
      },
    });

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    capture.clear();

    await runCLI([
      "store",
      "analyze",
      "--store-dir",
      storePath,
      "16.0.0",
      "--json",
    ]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<Record<string, { version: string; isComplete: boolean; counts: { present: number }; files: { missing?: string[] } }>>();
    expect(json).toHaveProperty("16.0.0");
    const version16 = json!["16.0.0"];
    expect(version16).toHaveProperty("version");
    expect(version16).toHaveProperty("isComplete");
    expect(version16).toHaveProperty("files");
    expect(version16).toHaveProperty("counts");
  });

  it("should show complete status for store with all files", async () => {
    const storePath = await testdir();

    const singleFileTree = [{
      type: "file" as const,
      name: "ArabicShaping.txt",
      path: "ArabicShaping.txt",
      lastModified: 1752862620000,
    }];

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": ({ params }) => {
          return HttpResponse.text(`Content of ${params.wildcard}`);
        },
      },
      files: {
        "*": singleFileTree,
      },
    });

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    capture.clear();

    await runCLI([
      "store",
      "analyze",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    expect(capture.containsInfo("Version: 16.0.0")).toBe(true);
    expect(capture.containsInfo("Status:")).toBe(true);
  });

  it("should show incomplete status when files are missing", async () => {
    const storePath = await testdir();

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
          name: "Blocks.txt",
          path: "/Blocks.txt",
          lastModified: 1752862620000,
        }, {
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
      "--include",
      "**/ArabicShaping.txt",
    ]);

    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "16.0.0",
      "--include",
      "**/ArabicShaping.txt",
    ]);

    capture.clear();

    await runCLI([
      "store",
      "analyze",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    expect(capture.containsWarn("incomplete")).toBe(true);
    expect(capture.containsWarn("Missing files")).toBe(true);
  });
});
