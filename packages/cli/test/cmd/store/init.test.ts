import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { dedent } from "@luxass/utils";
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

  it("should initialize store with basic options", async () => {
    const storePath = await testdir();

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "17.0.0",
    ]);

    // check that store was created
    expect(existsSync(storePath)).toBe(true);

    // check that manifest file exists
    const manifestPath = join(storePath, ".ucd-store.json");
    expect(existsSync(manifestPath)).toBe(true);

    // verify manifest content
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    expect(manifest).toBeTypeOf("object");
    expect(manifest["17.0.0"]).toBeDefined();
  });

  it("should fail if neither --remote nor --store-dir is specified", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await runCLI(["store", "init"]);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(5);
    expect(consoleErrorSpy).toHaveBeenCalledWith("\n❌ Error initializing store:");
    expect(consoleErrorSpy).toHaveBeenCalledWith("  Either --remote or --store-dir must be specified.");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Please check the store configuration and try again.");
    expect(consoleErrorSpy).toHaveBeenCalledWith("If the issue persists, consider running with --dry-run to see more details.");
    expect(consoleErrorSpy).toHaveBeenCalledWith("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  });

  it("should initialize with specific versions", async () => {
    const storePath = await testdir();

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "15.1.0",
      "15.0.0",
    ]);

    // check manifest contains only specified versions
    const manifestPath = join(storePath, ".ucd-store.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

    expect(Object.keys(manifest)).toEqual(expect.arrayContaining(["15.1.0", "15.0.0"]));
    expect(Object.keys(manifest)).toHaveLength(2);
  });

  it("should handle --dry-run flag", async () => {
    const storePath = await testdir();
    const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "--dry-run",
      "15.1.0",
    ]);

    expect(existsSync(join(storePath, ".ucd-store.json"))).toBe(false);
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining("Dry run complete"));
  });

  it("should handle prompts for versions", async () => {
    const storePath = await testdir();
    const { runVersionPrompt } = await import("../../../src/cmd/store/_shared");

    vi.mocked(runVersionPrompt).mockImplementationOnce(() => {
      return runVersionPrompt({
        input,
        output,
      });
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

    const manifestPath = join(storePath, ".ucd-store.json");
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    expect(manifest).toBeTypeOf("object");
    expect(Object.keys(manifest)).toHaveLength(2);
  });
});
