import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";
import { MockReadable, MockWritable } from "../../__test-utils";

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

  beforeEach(() => {
    output = new MockWritable();
    input = new MockReadable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should show help when --help flag is passed", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runCLI(["store", "init", "--help"]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Initialize an UCD Store");
    expect(output).toContain("--store-dir");
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

    // check that store was created
    expect(existsSync(storePath)).toBe(true);

    // check that lockfile exists (lockfile is .ucd-store.lock)
    const lockfilePath = join(storePath, ".ucd-store.lock");
    expect(existsSync(lockfilePath)).toBe(true);

    // verify lockfile content
    const lockfile = JSON.parse(readFileSync(lockfilePath, "utf-8"));
    expect(lockfile).toBeTypeOf("object");
    expect(lockfile.versions["17.0.0"]).toBeDefined();
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "init"]);

    expect(consoleErrorSpy).toHaveBeenCalled();
    // Check for the error message about missing --store-dir or --remote
    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Either --remote or --store-dir must be specified");
  });

  it("should fail if --remote is specified (init requires local store)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    await runCLI(["store", "init", "--remote"]);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Init operation requires a local store directory");
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

    // check lockfile contains only specified versions
    const lockfilePath = join(storePath, ".ucd-store.lock");
    const lockfile = JSON.parse(readFileSync(lockfilePath, "utf-8"));

    expect(Object.keys(lockfile.versions)).toEqual(expect.arrayContaining(["15.1.0", "15.0.0"]));
    expect(Object.keys(lockfile.versions)).toHaveLength(2);
  });

  it("should display mirror results after initialization", async () => {
    const storePath = await testdir();
    const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

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

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Store initialized successfully");
    expect(infoOutput).toContain("Starting mirror operation");
    expect(infoOutput).toContain("Mirror operation completed successfully");
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
