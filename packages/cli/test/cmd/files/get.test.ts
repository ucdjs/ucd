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

describe("files get command", () => {
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    await runCLI(["files", "get", "--help"]);

    expect(capture.containsInfo("Get a specific file from the UCD API")).toBe(true);
    expect(capture.containsInfo("--base-url")).toBe(true);
    expect(capture.containsInfo("--output")).toBe(true);
  });

  it("should error when no path is provided", async () => {
    await runCLI(["files", "get"]);

    expect(capture.containsError("Path is required")).toBe(true);
  });

  it("should get file content and output to stdout", async () => {
    const fileContent = "# Unicode Data File\n0041;LATIN CAPITAL LETTER A;Lu;";

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": () => {
          return HttpResponse.text(fileContent);
        },
      },
    });

    await runCLI(["files", "get", "16.0.0/UnicodeData.txt"]);

    expect(capture.containsInfo(fileContent)).toBe(true);
  });

  it("should write file to output path when --output is specified", async () => {
    const fileContent = "# Unicode Data File\n0041;LATIN CAPITAL LETTER A;Lu;";
    const outputDir = await testdir();
    const outputPath = join(outputDir, "output.txt");

    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": () => {
          return HttpResponse.text(fileContent);
        },
      },
    });

    await runCLI(["files", "get", "16.0.0/UnicodeData.txt", "--output", outputPath]);

    expect(capture.containsInfo("File written to:")).toBe(true);

    expect(existsSync(outputPath)).toBe(true);
    const writtenContent = readFileSync(outputPath, "utf-8");
    expect(writtenContent).toBe(fileContent);
  });

  it("should error when path is a directory not a file", async () => {
    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": () => {
          return HttpResponse.json([
            {
              type: "file",
              name: "UnicodeData.txt",
              path: "16.0.0/UnicodeData.txt",
              lastModified: 1752862620000,
            },
          ]);
        },
      },
    });

    await runCLI(["files", "get", "16.0.0"]);

    expect(capture.containsError("is a directory, not a file")).toBe(true);
  });

  it("should handle 404 error for non-existent file", async () => {
    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": () => {
          return HttpResponse.json(
            { status: 404, message: "Not found", timestamp: new Date().toISOString() },
            { status: 404 },
          );
        },
      },
    });

    await runCLI(["files", "get", "16.0.0/NonExistent.txt"]);

    expect(capture.containsError("Error fetching file")).toBe(true);
  });
});
