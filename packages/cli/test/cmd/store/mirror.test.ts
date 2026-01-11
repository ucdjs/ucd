import type { ConsoleOutputCapture } from "../../__test-utils";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";
import { captureConsoleOutput } from "../../__test-utils";

describe("store mirror command", () => {
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    await runCLI(["store", "mirror", "--help"]);

    expect(capture.containsLog("Mirror Unicode data files to local storage")).toBe(true);
    expect(capture.containsLog("--store-dir")).toBe(true);
    expect(capture.containsLog("--concurrency")).toBe(true);
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "mirror"]);

    expect(capture.containsError("--store-dir is required")).toBe(true);
  });

  it("should fail if --remote is specified (mirror requires local store)", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "mirror", "--remote"]);

    expect(capture.containsError("The --remote flag is not supported")).toBe(true);
  });

  it("should mirror specific versions", async () => {
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

    capture.clear();

    await runCLI([
      "store",
      "mirror",
      "--store-dir",
      storePath,
      "16.0.0",
    ]);

    expect(capture.containsLog("Mirror operation completed")).toBe(true);
  });

  it("should mirror all versions when none specified", async () => {
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
      "mirror",
      "--store-dir",
      storePath,
    ]);

    expect(capture.containsLog("Mirror operation completed")).toBe(true);
  });

  it("should create version directories and files", async () => {
    const storePath = await testdir();

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
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

    expect(existsSync(join(storePath, "16.0.0"))).toBe(true);

    expect(existsSync(join(storePath, "16.0.0", "UnicodeData.txt"))).toBe(true);

    const content = readFileSync(join(storePath, "16.0.0", "UnicodeData.txt"), "utf-8");
    expect(content).toContain("Content of");
  });

  it("should display download statistics", async () => {
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

    expect(capture.containsLog("Downloaded")).toBe(true);
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
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": true,
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
      "**/Arabic*.txt",
    ]);

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
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/versions/{version}/file-tree": true,
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
      "--exclude",
      "**/Bidi*.txt",
    ]);

    expect(existsSync(join(storePath, "16.0.0", "ArabicShaping.txt"))).toBe(true);
    expect(existsSync(join(storePath, "16.0.0", "BidiBrackets.txt"))).toBe(false);
    expect(existsSync(join(storePath, "16.0.0", "UnicodeData.txt"))).toBe(true);
  });
});
