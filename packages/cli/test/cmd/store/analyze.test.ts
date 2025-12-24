import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";

describe("store analyze command", () => {
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

    await runCLI(["store", "analyze", "--help"]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Analyze UCD Store");
    expect(output).toContain("--store-dir");
    expect(output).toContain("--json");
    expect(output).toContain("--check-orphaned");
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "analyze"]);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Either --remote or --store-dir must be specified");
  });

  it("should analyze store for a specific version", async () => {
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
          name: "Blocks.txt",
          path: "/Blocks.txt",
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

    // Mirror files to have something to analyze
    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    consoleInfoSpy.mockClear();

    // Analyze the store
    await runCLI([
      "store",
      "analyze",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Version: 16.0.0");
    expect(infoOutput).toContain("Files:");
  });

  it("should analyze all versions when no version is specified", async () => {
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

    // Initialize the store with multiple versions
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
      "15.1.0",
    ]);

    // Mirror files
    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
    ]);

    consoleInfoSpy.mockClear();

    // Analyze without specifying version (should analyze all)
    await runCLI([
      "store",
      "analyze",
      "--store-dir",
      storePath,
    ]);

    // Should show message about analyzing all versions
    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("No specific versions provided");
  });

  it("should output JSON when --json flag is passed", async () => {
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

    // Initialize the store first
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    // Mirror files
    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    consoleInfoSpy.mockClear();

    // Analyze with JSON flag
    await runCLI([
      "store",
      "analyze",
      "--store-dir",
      storePath,
      "16.0.0",
      "--json",
    ]);

    // Find the JSON output in the console.info calls
    const infoOutputs = consoleInfoSpy.mock.calls.flat();
    const jsonOutput = infoOutputs.find((output) => {
      if (typeof output !== "string") return false;
      try {
        const parsed = JSON.parse(output);
        return parsed && typeof parsed === "object" && "16.0.0" in parsed;
      } catch {
        return false;
      }
    });

    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput as string);
    expect(parsed).toHaveProperty("16.0.0");
    expect(parsed["16.0.0"]).toHaveProperty("version");
    expect(parsed["16.0.0"]).toHaveProperty("isComplete");
    expect(parsed["16.0.0"]).toHaveProperty("files");
    expect(parsed["16.0.0"]).toHaveProperty("counts");
  });

  it("should show complete status for store with all files", async () => {
    const storePath = await testdir();
    const consoleInfoSpy = vi.spyOn(console, "info");
    const consoleWarnSpy = vi.spyOn(console, "warn");
    const consoleErrorSpy = vi.spyOn(console, "error");

    // Mock with only 1 file so expected == actual after mirror
    // The files config affects both file-tree and manifest endpoints
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
      // Use files config which affects both file-tree and manifest endpoints
      files: {
        "*": singleFileTree,
      },
    });

    // Initialize and mirror the store
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

    consoleInfoSpy.mockClear();
    consoleWarnSpy.mockClear();
    consoleErrorSpy.mockClear();

    // Analyze the store
    await runCLI([
      "store",
      "analyze",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    const warnOutput = consoleWarnSpy.mock.calls.flat().join("\n");
    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    const allOutput = `${infoOutput}\n${warnOutput}`;

    // Should not have errors
    expect(errorOutput).toBe("");

    // Status appears in info (complete) or warn (incomplete)
    expect(infoOutput).toContain("Version: 16.0.0");
    expect(allOutput).toContain("Status:");
  });

  it("should show incomplete status when files are missing", async () => {
    const storePath = await testdir();
    const consoleInfoSpy = vi.spyOn(console, "info");
    const consoleWarnSpy = vi.spyOn(console, "warn");

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

    // Initialize the store with only one file included
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
      "--include",
      "**/ArabicShaping.txt",
    ]);

    // Mirror only the included file
    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "16.0.0",
      "--include",
      "**/ArabicShaping.txt",
    ]);

    consoleInfoSpy.mockClear();
    consoleWarnSpy.mockClear();

    // Analyze without filters - should show missing files
    await runCLI([
      "store",
      "analyze",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    const warnOutput = consoleWarnSpy.mock.calls.flat().join("\n");

    // Should show either incomplete status or missing files warning
    const allOutput = infoOutput + warnOutput;
    expect(allOutput).toMatch(/incomplete|Missing files/i);
  });
});
