import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";

describe("store sync command", () => {
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

    await runCLI(["store", "sync", "--help"]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Sync lockfile with API and mirror files");
    expect(output).toContain("--store-dir");
    expect(output).toContain("--concurrency");
    expect(output).toContain("--remove-unavailable");
    expect(output).toContain("--clean");
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "sync"]);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Either --remote or --store-dir must be specified");
  });

  it("should fail if --remote is used (sync requires local store)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "sync", "--remote"]);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Sync operation requires a local store directory");
  });

  it("should sync store for specific versions", async () => {
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

    // Sync the store
    await runCLI([
      "store",
      "sync",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Starting sync operation");
    expect(infoOutput).toContain("Syncing 1 version(s)");
    expect(infoOutput).toContain("16.0.0");
  });

  it("should sync all versions when no version is specified", async () => {
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

    // Initialize the store with multiple versions
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
      "15.1.0",
    ]);

    consoleInfoSpy.mockClear();

    // Sync without specifying versions
    await runCLI([
      "store",
      "sync",
      "--store-dir",
      storePath,
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Starting sync operation");
    expect(infoOutput).toContain("Syncing all versions in lockfile");
  });

  it("should show success message after sync", async () => {
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

    // Initialize and sync the store
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    consoleInfoSpy.mockClear();

    await runCLI([
      "store",
      "sync",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Sync completed successfully");
  });

  it("should display mirror results after sync", async () => {
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

    // Initialize the store
    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    consoleInfoSpy.mockClear();

    // Sync the store
    await runCLI([
      "store",
      "sync",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    // Should show either Summary or version count info
    expect(infoOutput).toContain("Total versions in lockfile:");
  });
});
