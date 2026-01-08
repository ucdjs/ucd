import type { ConsoleOutputCapture } from "../../__test-utils";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";
import { captureConsoleOutput } from "../../__test-utils";

describe("store status command", () => {
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    await runCLI(["store", "status", "--help"]);

    expect(capture.containsLog("Show UCD Store status and lockfile information")).toBe(true);
    expect(capture.containsLog("--store-dir")).toBe(true);
    expect(capture.containsLog("--json")).toBe(true);
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "status"]);

    expect(capture.containsError("Either --remote or --store-dir must be specified")).toBe(true);
  });

  it("should show status for local store with lockfile", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
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
    ]);

    capture.clear();

    await runCLI([
      "store",
      "status",
      "--store-dir",
      storePath,
    ]);

    expect(capture.containsLog("Store Status:")).toBe(true);
    expect(capture.containsLog("Lockfile:")).toBe(true);
    expect(capture.containsLog("Total Versions:")).toBe(true);
  });

  it("should error when lockfile does not exist", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI([
      "store",
      "status",
      "--store-dir",
      storePath,
    ]);

    expect(capture.containsError("lockfile not found")).toBe(true);
  });

  it("should output JSON when --json flag is passed", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": true,
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
      "status",
      "--store-dir",
      storePath,
      "--json",
    ]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{ lockfilePath: string; lockfileVersion: number; totalVersions: number }>();
    expect(json).toHaveProperty("lockfilePath");
    expect(json).toHaveProperty("lockfileVersion");
    expect(json).toHaveProperty("totalVersions");
    expect(json).toHaveProperty("versions");
    expect(json).toHaveProperty("summary");
  });

  it("should show version information", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
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

    capture.clear();

    await runCLI([
      "store",
      "status",
      "--store-dir",
      storePath,
    ]);

    expect(capture.containsLog("Version 16.0.0")).toBe(true);
    expect(capture.containsLog("Version 15.1.0")).toBe(true);
  });
});
