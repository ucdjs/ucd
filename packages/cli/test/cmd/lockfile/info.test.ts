import type { ConsoleOutputCapture } from "../../__test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";
import { captureConsoleOutput } from "../../__test-utils";

describe("lockfile info command", () => {
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    await runCLI(["lockfile", "info", "--help"]);

    expect(capture.containsInfo("Display lockfile information and summary")).toBe(true);
    expect(capture.containsInfo("--store-dir")).toBe(true);
    expect(capture.containsInfo("--json")).toBe(true);
  });

  it("should error when lockfile does not exist", async () => {
    const storePath = await testdir();

    await runCLI(["lockfile", "info", "--store-dir", storePath]);

    expect(capture.containsError("Could not read lockfile")).toBe(true);
  });

  it("should display lockfile information", async () => {
    const lockfile = {
      lockfileVersion: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      versions: {
        "16.0.0": {
          path: "16.0.0/snapshot.json",
          fileCount: 100,
          totalSize: 50000,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        "15.1.0": {
          path: "15.1.0/snapshot.json",
          fileCount: 95,
          totalSize: 48000,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      },
    };

    const storePath = await testdir({
      ".ucd-store.lock": JSON.stringify(lockfile),
    });

    await runCLI(["lockfile", "info", "--store-dir", storePath]);

    expect(capture.containsLog("UCD Store Lockfile Information")).toBe(true);
    expect(capture.containsLog("Total Versions:")).toBe(true);
    expect(capture.containsLog("2")).toBe(true);
    expect(capture.containsLog("16.0.0")).toBe(true);
    expect(capture.containsLog("15.1.0")).toBe(true);
  });

  it("should display filters when present", async () => {
    const lockfile = {
      lockfileVersion: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      versions: {},
      filters: {
        include: ["*.txt"],
        exclude: ["*.zip"],
      },
    };

    const storePath = await testdir({
      ".ucd-store.lock": JSON.stringify(lockfile),
    });

    await runCLI(["lockfile", "info", "--store-dir", storePath]);

    expect(capture.containsLog("Filters:")).toBe(true);
    expect(capture.containsLog("Include:")).toBe(true);
    expect(capture.containsLog("*.txt")).toBe(true);
    expect(capture.containsLog("Exclude:")).toBe(true);
    expect(capture.containsLog("*.zip")).toBe(true);
  });

  it("should output JSON when --json flag is passed", async () => {
    const lockfile = {
      lockfileVersion: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      versions: {
        "16.0.0": {
          path: "16.0.0/snapshot.json",
          fileCount: 100,
          totalSize: 50000,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      },
    };

    const storePath = await testdir({
      ".ucd-store.lock": JSON.stringify(lockfile),
    });

    await runCLI(["lockfile", "info", "--store-dir", storePath, "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      lockfileVersion: number;
      totalVersions: number;
      totalFiles: number;
      totalSize: number;
      versions: Array<{ version: string; fileCount: number }>;
    }>();

    expect(json).toHaveProperty("lockfileVersion", 1);
    expect(json).toHaveProperty("totalVersions", 1);
    expect(json).toHaveProperty("totalFiles", 100);
    expect(json).toHaveProperty("totalSize", 50000);
    expect(json?.versions).toHaveLength(1);
  });

  it("should sort versions by semver descending", async () => {
    const lockfile = {
      lockfileVersion: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      versions: {
        "14.0.0": {
          path: "14.0.0/snapshot.json",
          fileCount: 90,
          totalSize: 45000,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        "16.0.0": {
          path: "16.0.0/snapshot.json",
          fileCount: 100,
          totalSize: 50000,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        "15.1.0": {
          path: "15.1.0/snapshot.json",
          fileCount: 95,
          totalSize: 48000,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      },
    };

    const storePath = await testdir({
      ".ucd-store.lock": JSON.stringify(lockfile),
    });

    await runCLI(["lockfile", "info", "--store-dir", storePath]);

    const output = capture.getLogOutput();
    const idx16 = output.indexOf("16.0.0");
    const idx15 = output.indexOf("15.1.0");
    const idx14 = output.indexOf("14.0.0");

    // 16.0.0 should appear before 15.1.0, which should appear before 14.0.0
    expect(idx16).toBeLessThan(idx15);
    expect(idx15).toBeLessThan(idx14);
  });
});
