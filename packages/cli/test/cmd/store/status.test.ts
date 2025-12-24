import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";

describe("store status command", () => {
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

    await runCLI(["store", "status", "--help"]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Show UCD Store status and lockfile information");
    expect(output).toContain("--store-dir");
    expect(output).toContain("--json");
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "status"]);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Either --remote or --store-dir must be specified");
  });

  it("should show status for local store with lockfile", async () => {
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

    consoleInfoSpy.mockClear();

    // Then check status
    await runCLI([
      "store",
      "status",
      "--store-dir",
      storePath,
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Store Status:");
    expect(infoOutput).toContain("Lockfile:");
    expect(infoOutput).toContain("Total Versions:");
  });

  it("should error when lockfile does not exist", async () => {
    const storePath = await testdir();
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI([
      "store",
      "status",
      "--store-dir",
      storePath,
    ]);

    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("lockfile not found");
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

    consoleInfoSpy.mockClear();

    // Then check status with JSON flag
    await runCLI([
      "store",
      "status",
      "--store-dir",
      storePath,
      "--json",
    ]);

    // Find the JSON output in the console.info calls
    // The JSON output should be a properly formatted JSON object
    const infoOutputs = consoleInfoSpy.mock.calls.flat();
    const jsonOutput = infoOutputs.find((output) => {
      if (typeof output !== "string") return false;
      try {
        const parsed = JSON.parse(output);
        return parsed && typeof parsed === "object" && "lockfilePath" in parsed;
      } catch {
        return false;
      }
    });

    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput as string);
    expect(parsed).toHaveProperty("lockfilePath");
    expect(parsed).toHaveProperty("lockfileVersion");
    expect(parsed).toHaveProperty("totalVersions");
    expect(parsed).toHaveProperty("versions");
    expect(parsed).toHaveProperty("summary");
  });

  it("should show version information", async () => {
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

    await runCLI([
      "store",
      "status",
      "--store-dir",
      storePath,
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Version 16.0.0");
    expect(infoOutput).toContain("Version 15.1.0");
  });
});
