import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";

describe("store init command", () => {
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

  it("should handle missing path argument", async () => {
    await expect(async () => {
      await runCLI(["store", "init"]);
    }).rejects.toThrow();
  });

  it("should initialize with specific versions", async () => {
    const storePath = await testdir();

    await runCLI([
      "store",
      "init",
      "--store-dir",
      storePath,
      "--versions",
      "15.1.0,15.0.0",
    ]);

    // Check manifest contains only specified versions
    const manifestPath = join(storePath, ".ucd-store.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

    expect(Object.keys(manifest)).toEqual(expect.arrayContaining(["15.1.0", "15.0.0"]));
    expect(Object.keys(manifest)).toHaveLength(2);
  });

  it("should respect --force flag for existing stores", async () => {
    const storePath = await testdir();

    // First init
    await runCLI([
      "store",
      "init",
      "--path",
      storePath,
      "--versions",
      "15.1.0",
    ]);

    const originalManifest = readFileSync(join(storePath, ".ucd-store.json"), "utf-8");

    // Second init with --force should recreate
    await runCLI([
      "store",
      "init",
      "--path",
      storePath,
      "--force",
      "--versions",
      "15.0.0",
    ]);

    // Should have new content
    const newManifest = readFileSync(join(storePath, ".ucd-store.json"), "utf-8");
    expect(newManifest).not.toBe(originalManifest);

    const manifest = JSON.parse(newManifest);
    expect(Object.keys(manifest)).toEqual(["15.0.0"]);
  });

  it("should fail on existing store without --force", async () => {
    const storePath = await testdir();

    // First init
    await runCLI([
      "store",
      "init",
      "--path",
      storePath,
    ]);

    // Second init without --force should fail
    await expect(async () => {
      await runCLI([
        "store",
        "init",
        "--path",
        storePath,
      ]);
    }).rejects.toThrow();
  });

  it("should create directory structure for versions", async () => {
    const storePath = await testdir();

    await runCLI([
      "store",
      "init",
      "--path",
      storePath,
      "--versions",
      "15.1.0",
    ]);

    // Check version directory exists
    const versionDir = join(storePath, "15.1.0");
    expect(existsSync(versionDir)).toBe(true);
  });

  it("should handle invalid version format", async () => {
    const storePath = await testdir();

    await expect(async () => {
      await runCLI([
        "store",
        "init",
        "--path",
        storePath,
        "--versions",
        "invalid-version-format",
      ]);
    }).rejects.toThrow();
  });

  it("should work with relative paths", async () => {
    const storePath = "./relative-store";

    await runCLI([
      "store",
      "init",
      "--path",
      storePath,
      "--versions",
      "15.1.0",
    ]);

    // Should resolve relative path and create store
    expect(existsSync(storePath)).toBe(true);
    expect(existsSync(join(storePath, ".ucd-store.json"))).toBe(true);

    // Cleanup
    await import("node:fs/promises").then((fs) => fs.rm(storePath, { recursive: true, force: true }));
  });
});
