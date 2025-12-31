import type { ConsoleOutputCapture } from "../../__test-utils";
import { dedent } from "@luxass/utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";
import { captureConsoleOutput } from "../../__test-utils";

describe("lockfile hash command", () => {
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    await runCLI(["lockfile", "hash", "--help"]);

    expect(capture.containsInfo("Compute content hash for a file")).toBe(true);
    expect(capture.containsInfo("--strip-header")).toBe(true);
    expect(capture.containsInfo("--compare")).toBe(true);
    expect(capture.containsInfo("--json")).toBe(true);
  });

  it("should error when file path is not provided", async () => {
    await runCLI(["lockfile", "hash"]);

    expect(capture.containsError("File path is required")).toBe(true);
  });

  it("should error when file does not exist", async () => {
    const storePath = await testdir();

    await runCLI(["lockfile", "hash", `${storePath}/nonexistent.txt`]);

    expect(capture.containsError("File not found")).toBe(true);
  });

  it("should compute hash of a simple file", async () => {
    const storePath = await testdir({
      "test.txt": "Hello, World!",
    });

    await runCLI(["lockfile", "hash", `${storePath}/test.txt`]);

    expect(capture.containsLog("File Hash Information")).toBe(true);
    expect(capture.containsLog("File:")).toBe(true);
    expect(capture.containsLog("Size:")).toBe(true);
    expect(capture.containsLog("File Hash:")).toBe(true);
    expect(capture.containsLog("Content Hash:")).toBe(true);
    expect(capture.containsLog("sha256:")).toBe(true);
  });

  it("should detect Unicode header in file", async () => {
    const content = dedent`
      # UnicodeData-16.0.0.txt
      # Date: 2024-01-01, 00:00:00 GMT
      # © 2024 Unicode®, Inc.

      Actual data here
    `;

    const storePath = await testdir({
      "UnicodeData.txt": content,
    });

    await runCLI(["lockfile", "hash", `${storePath}/UnicodeData.txt`]);

    expect(capture.containsLog("Unicode Header:")).toBe(true);
    expect(capture.containsLog("Present")).toBe(true);
    expect(capture.containsLog("Header Lines:")).toBe(true);
  });

  it("should show different hashes for file with header", async () => {
    const content = dedent`
      # UnicodeData-16.0.0.txt
      # Date: 2024-01-01, 00:00:00 GMT

      Actual data
    `;

    const storePath = await testdir({
      "UnicodeData.txt": content,
    });

    await runCLI(["lockfile", "hash", `${storePath}/UnicodeData.txt`, "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      fileHash: string;
      contentHash: string;
      hasUnicodeHeader: boolean;
    }>();

    expect(json?.hasUnicodeHeader).toBe(true);
    expect(json?.fileHash).not.toBe(json?.contentHash);
  });

  it("should show same hashes for file without header", async () => {
    const storePath = await testdir({
      "test.txt": "Just regular content",
    });

    await runCLI(["lockfile", "hash", `${storePath}/test.txt`, "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      fileHash: string;
      contentHash: string;
      hasUnicodeHeader: boolean;
    }>();

    expect(json?.hasUnicodeHeader).toBe(false);
    expect(json?.fileHash).toBe(json?.contentHash);
  });

  it("should compare hashes when --compare is provided (matching)", async () => {
    const storePath = await testdir({
      "test.txt": "",
    });

    // SHA-256 of empty string
    const expectedHash = "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    await runCLI(["lockfile", "hash", `${storePath}/test.txt`, "--compare", expectedHash]);

    expect(capture.containsLog("Comparison:")).toBe(true);
    expect(capture.containsLog("Hashes match")).toBe(true);
  });

  it("should compare hashes when --compare is provided (not matching)", async () => {
    const storePath = await testdir({
      "test.txt": "Hello, World!",
    });

    const wrongHash = "sha256:0000000000000000000000000000000000000000000000000000000000000000";

    await runCLI(["lockfile", "hash", `${storePath}/test.txt`, "--compare", wrongHash]);

    expect(capture.containsLog("Comparison:")).toBe(true);
    expect(capture.containsLog("Hashes do not match")).toBe(true);
  });

  it("should normalize hash without sha256: prefix for comparison", async () => {
    const storePath = await testdir({
      "test.txt": "",
    });

    // SHA-256 of empty string without prefix
    const hashWithoutPrefix = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    await runCLI(["lockfile", "hash", `${storePath}/test.txt`, "--compare", hashWithoutPrefix]);

    expect(capture.containsLog("Hashes match")).toBe(true);
  });

  it("should use content hash when --strip-header is provided", async () => {
    const content = dedent`
      # UnicodeData-16.0.0.txt
      # Date: 2024-01-01, 00:00:00 GMT

      Actual data
    `;

    const storePath = await testdir({
      "UnicodeData.txt": content,
    });

    await runCLI(["lockfile", "hash", `${storePath}/UnicodeData.txt`, "--strip-header", "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      usedHash: string;
      primaryHash: string;
      contentHash: string;
    }>();

    expect(json?.usedHash).toBe("contentHash");
    expect(json?.primaryHash).toBe(json?.contentHash);
  });

  it("should output JSON when --json flag is passed", async () => {
    const storePath = await testdir({
      "test.txt": "Hello, World!",
    });

    await runCLI(["lockfile", "hash", `${storePath}/test.txt`, "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      success: boolean;
      filePath: string;
      fileSize: number;
      formattedSize: string;
      fileHash: string;
      contentHash: string;
      hasUnicodeHeader: boolean;
      usedHash: string;
      primaryHash: string;
    }>();

    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("filePath");
    expect(json).toHaveProperty("fileSize");
    expect(json).toHaveProperty("formattedSize");
    expect(json).toHaveProperty("fileHash");
    expect(json).toHaveProperty("contentHash");
    expect(json).toHaveProperty("hasUnicodeHeader");
    expect(json).toHaveProperty("usedHash");
    expect(json).toHaveProperty("primaryHash");
  });

  it("should output JSON error when file not found", async () => {
    const storePath = await testdir();

    await runCLI(["lockfile", "hash", `${storePath}/nonexistent.txt`, "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      success: boolean;
      error: string;
    }>();

    expect(json).toHaveProperty("success", false);
    expect(json).toHaveProperty("error", "FILE_NOT_FOUND");
  });

  it("should include comparison result in JSON output", async () => {
    const storePath = await testdir({
      "test.txt": "",
    });

    const expectedHash = "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    await runCLI(["lockfile", "hash", `${storePath}/test.txt`, "--compare", expectedHash, "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{
      comparison: {
        providedHash: string;
        matches: boolean;
      };
    }>();

    expect(json?.comparison).toBeDefined();
    expect(json?.comparison.matches).toBe(true);
    expect(json?.comparison.providedHash).toBe(expectedHash);
  });
});
