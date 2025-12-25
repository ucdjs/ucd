import type { ConsoleOutputCapture } from "../../__test-utils";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";
import { captureConsoleOutput, MockReadable, MockWritable } from "../../__test-utils";

vi.mock("../../../src/cmd/store/_shared", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../src/cmd/store/_shared")>();
  return {
    ...original,
    runVersionPrompt: vi.fn(original.runVersionPrompt),
  };
});

describe("store init command", () => {
  let output: MockWritable;
  let input: MockReadable;
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    output = new MockWritable();
    input = new MockReadable();
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    const helpCapture = captureConsoleOutput();
    await runCLI(["store", "init", "--help"]);

    expect(helpCapture.contains("Initialize an UCD Store")).toBe(true);
    expect(helpCapture.contains("--store-dir")).toBe(true);

    helpCapture.restore();
  });

  it("should initialize store with basic options", async () => {
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
      "17.0.0",
    ]);

    expect(existsSync(storePath)).toBe(true);

    const lockfilePath = join(storePath, ".ucd-store.lock");
    expect(existsSync(lockfilePath)).toBe(true);

    const lockfile = JSON.parse(readFileSync(lockfilePath, "utf-8"));
    expect(lockfile).toBeTypeOf("object");
    expect(lockfile.versions["17.0.0"]).toBeDefined();
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "init"]);

    expect(capture.containsError("Either --remote or --store-dir must be specified")).toBe(true);
  });

  it("should fail if --remote is specified (init requires local store)", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "init", "--remote"]);

    expect(capture.containsError("Init operation requires a local store directory")).toBe(true);
  });

  it("should initialize with specific versions", async () => {
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
      "15.1.0",
      "15.0.0",
    ]);

    const lockfilePath = join(storePath, ".ucd-store.lock");
    const lockfile = JSON.parse(readFileSync(lockfilePath, "utf-8"));

    expect(Object.keys(lockfile.versions)).toEqual(expect.arrayContaining(["15.1.0", "15.0.0"]));
    expect(Object.keys(lockfile.versions)).toHaveLength(2);
  });

  it("should display mirror results after initialization", async () => {
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
      "15.1.0",
    ]);

    expect(capture.containsInfo("Store initialized successfully")).toBe(true);
    expect(capture.containsInfo("Starting mirror operation")).toBe(true);
    expect(capture.containsInfo("Mirror operation completed successfully")).toBe(true);
  });

  it("should handle prompts for versions when none provided", async () => {
    const storePath = await testdir();
    const { runVersionPrompt } = await import("../../../src/cmd/store/_shared");

    vi.mocked(runVersionPrompt).mockImplementationOnce(() => {
      return runVersionPrompt({
        input,
        output,
      });
    });

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
          name: "BidiBrackets.txt",
          path: "/BidiBrackets.txt",
          lastModified: 1752862620000,
        }],
        "/api/v1/files/{wildcard}": ({ params }) => {
          return HttpResponse.text(`Content of ${params.wildcard}`);
        },
      },
    });

    const cliPromise = runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
    ]);

    await new Promise((resolve) => setTimeout(resolve, 100));

    input.emit("keypress", "", { name: "space" });
    input.emit("keypress", "", { name: "down" });
    input.emit("keypress", "", { name: "space" });
    input.emit("keypress", "", { name: "return" });

    await cliPromise;

    const lockfilePath = join(storePath, ".ucd-store.lock");
    expect(existsSync(lockfilePath)).toBe(true);

    const lockfile = JSON.parse(readFileSync(lockfilePath, "utf-8"));
    expect(lockfile).toBeTypeOf("object");
    expect(Object.keys(lockfile.versions)).toHaveLength(2);
  });
});
