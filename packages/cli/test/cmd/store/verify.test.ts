import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";

describe("store verify command", () => {
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

    await runCLI(["store", "verify", "--help"]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Verify UCD Store integrity");
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

    await runCLI(["store", "verify"]);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Either --remote or --store-dir must be specified");
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
      "verify",
      "--store-dir",
      storePath,
    ]);

    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("lockfile not found");
  });

  it("should verify store successfully when all versions match", async () => {
    const storePath = await testdir();
    const consoleInfoSpy = vi.spyOn(console, "info");

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

    // Initialize the store first
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    consoleInfoSpy.mockClear();

    // Verify the store
    await runCLI([
      "store",
      "verify",
      "--store-dir",
      storePath,
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Store verification passed");
  });

  it("should output JSON when --json flag is passed", async () => {
    const storePath = await testdir();
    const consoleInfoSpy = vi.spyOn(console, "info");

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

    // Initialize the store first
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    consoleInfoSpy.mockClear();

    // Verify with JSON flag
    await runCLI([
      "store",
      "verify",
      "--store-dir",
      storePath,
      "--json",
    ]);

    // Find the JSON output in the console.info calls
    const infoOutputs = consoleInfoSpy.mock.calls.flat();
    const jsonOutput = infoOutputs.find((output) => {
      if (typeof output !== "string") return false;
      try {
        const parsed = JSON.parse(output);
        return parsed && typeof parsed === "object" && "valid" in parsed;
      } catch {
        return false;
      }
    });

    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput as string);
    expect(parsed).toHaveProperty("valid");
    expect(parsed).toHaveProperty("lockfileVersions");
    expect(parsed).toHaveProperty("availableVersions");
    expect(parsed).toHaveProperty("missingVersions");
    expect(parsed).toHaveProperty("extraVersions");
    expect(parsed).toHaveProperty("validVersions");
  });

  it("should show warning for versions available in API but not in lockfile", async () => {
    const storePath = await testdir();
    const consoleInfoSpy = vi.spyOn(console, "info");

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

    // Initialize the store with only one version
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    consoleInfoSpy.mockClear();

    // Verify the store
    await runCLI([
      "store",
      "verify",
      "--store-dir",
      storePath,
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    // Should pass verification but note about extra versions
    expect(infoOutput).toContain("Store verification passed");
    // Should mention versions available in API but not in lockfile
    expect(infoOutput).toContain("version(s) available in API but not in lockfile");
  });
});
