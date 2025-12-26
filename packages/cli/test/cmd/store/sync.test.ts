import type { ConsoleOutputCapture } from "../../__test-utils";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";
import { captureConsoleOutput } from "../../__test-utils";

describe("store sync command", () => {
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    await runCLI(["store", "sync", "--help"]);

    expect(capture.containsInfo("Sync lockfile with API and mirror files")).toBe(true);
    expect(capture.containsInfo("--store-dir")).toBe(true);
    expect(capture.containsInfo("--concurrency")).toBe(true);
    expect(capture.containsInfo("--remove-unavailable")).toBe(true);
    expect(capture.containsInfo("--clean")).toBe(true);
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "sync"]);

    expect(capture.containsError("Either --remote or --store-dir must be specified")).toBe(true);
  });

  it("should fail if --remote is used (sync requires local store)", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "sync", "--remote"]);

    expect(capture.containsError("Sync operation requires a local store directory")).toBe(true);
  });

  it("should sync store for specific versions", async () => {
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

    capture.clear();

    await runCLI([
      "store",
      "sync",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    expect(capture.containsInfo("Starting sync operation")).toBe(true);
    expect(capture.containsInfo("Syncing 1 version(s)")).toBe(true);
    expect(capture.containsInfo("16.0.0")).toBe(true);
  });

  it("should sync all versions when no version is specified", async () => {
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
      "15.1.0",
    ]);

    capture.clear();

    await runCLI([
      "store",
      "sync",
      "--store-dir",
      storePath,
    ]);

    expect(capture.containsInfo("Starting sync operation")).toBe(true);
    expect(capture.containsInfo("Syncing all versions in lockfile")).toBe(true);
  });

  it("should show success message after sync", async () => {
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

    capture.clear();

    await runCLI([
      "store",
      "sync",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    expect(capture.containsInfo("Sync completed successfully")).toBe(true);
  });

  it("should display mirror results after sync", async () => {
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

    capture.clear();

    await runCLI([
      "store",
      "sync",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    expect(capture.containsInfo("Total versions in lockfile:")).toBe(true);
  });
});
