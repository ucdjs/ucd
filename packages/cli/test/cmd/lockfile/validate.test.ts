import type { ConsoleOutputCapture } from "../../__test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";
import { captureConsoleOutput } from "../../__test-utils";

describe("lockfile validate command", () => {
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    await runCLI(["lockfile", "validate", "--help"]);

    expect(capture.containsInfo("Validate lockfile against the expected schema")).toBe(true);
    expect(capture.containsInfo("--store-dir")).toBe(true);
    expect(capture.containsInfo("--json")).toBe(true);
  });

  it("should error when lockfile does not exist", async () => {
    const storePath = await testdir();

    await runCLI(["lockfile", "validate", "--store-dir", storePath]);

    expect(capture.containsError("Lockfile not found")).toBe(true);
  });

  it("should validate a valid lockfile", async () => {
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

    await runCLI(["lockfile", "validate", "--store-dir", storePath]);

    expect(capture.containsLog("Lockfile is valid")).toBe(true);
    expect(capture.containsLog("Lockfile Version:")).toBe(true);
    expect(capture.containsLog("Tracked Versions:")).toBe(true);
  });

  it("should report invalid JSON", async () => {
    const storePath = await testdir({
      ".ucd-store.lock": "not valid json {",
    });

    await runCLI(["lockfile", "validate", "--store-dir", storePath]);

    expect(capture.containsError("Lockfile is not valid JSON")).toBe(true);
  });

  it("should report schema validation errors", async () => {
    const invalidLockfile = {
      lockfileVersion: 999, // Invalid version
      versions: {},
    };

    const storePath = await testdir({
      ".ucd-store.lock": JSON.stringify(invalidLockfile),
    });

    await runCLI(["lockfile", "validate", "--store-dir", storePath]);

    expect(capture.containsError("Lockfile does not match expected schema")).toBe(true);
    expect(capture.containsLog("Issues:")).toBe(true);
  });

  it("should show warnings for empty versions", async () => {
    const lockfile = {
      lockfileVersion: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      versions: {},
    };

    const storePath = await testdir({
      ".ucd-store.lock": JSON.stringify(lockfile),
    });

    await runCLI(["lockfile", "validate", "--store-dir", storePath]);

    expect(capture.containsLog("Lockfile is valid")).toBe(true);
    expect(capture.containsLog("Warnings:")).toBe(true);
    expect(capture.containsLog("no versions tracked")).toBe(true);
  });

  it("should show warnings for versions with 0 files", async () => {
    const lockfile = {
      lockfileVersion: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      versions: {
        "16.0.0": {
          path: "16.0.0/snapshot.json",
          fileCount: 0,
          totalSize: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      },
    };

    const storePath = await testdir({
      ".ucd-store.lock": JSON.stringify(lockfile),
    });

    await runCLI(["lockfile", "validate", "--store-dir", storePath]);

    expect(capture.containsLog("Lockfile is valid")).toBe(true);
    expect(capture.containsLog("Warnings:")).toBe(true);
    expect(capture.containsLog("16.0.0")).toBe(true);
    expect(capture.containsLog("0 files")).toBe(true);
  });

  it("should output JSON when --json flag is passed with valid lockfile", async () => {
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

    await runCLI(["lockfile", "validate", "--store-dir", storePath, "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      valid: boolean;
      lockfileVersion: number;
      versionCount: number;
    }>();

    expect(json).toHaveProperty("valid", true);
    expect(json).toHaveProperty("lockfileVersion", 1);
    expect(json).toHaveProperty("versionCount", 1);
  });

  it("should output JSON when --json flag is passed with invalid lockfile", async () => {
    const invalidLockfile = {
      lockfileVersion: 999,
      versions: {},
    };

    const storePath = await testdir({
      ".ucd-store.lock": JSON.stringify(invalidLockfile),
    });

    await runCLI(["lockfile", "validate", "--store-dir", storePath, "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      valid: boolean;
      error: string;
      issues: Array<{ path: string; message: string }>;
    }>();

    expect(json).toHaveProperty("valid", false);
    expect(json).toHaveProperty("error", "SCHEMA_VALIDATION_FAILED");
    expect(json?.issues).toBeDefined();
    expect(json?.issues.length).toBeGreaterThan(0);
  });

  it("should output JSON when lockfile not found", async () => {
    const storePath = await testdir();

    await runCLI(["lockfile", "validate", "--store-dir", storePath, "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      valid: boolean;
      error: string;
    }>();

    expect(json).toHaveProperty("valid", false);
    expect(json).toHaveProperty("error", "LOCKFILE_NOT_FOUND");
  });

  it("should include warnings in JSON output", async () => {
    const lockfile = {
      lockfileVersion: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      versions: {},
    };

    const storePath = await testdir({
      ".ucd-store.lock": JSON.stringify(lockfile),
    });

    await runCLI(["lockfile", "validate", "--store-dir", storePath, "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      valid: boolean;
      warnings?: string[];
    }>();

    expect(json).toHaveProperty("valid", true);
    expect(json?.warnings).toBeDefined();
    expect(json?.warnings).toContain("Lockfile has no versions tracked.");
  });
});
