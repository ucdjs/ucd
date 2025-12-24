import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { runCLI } from "../../../src/cli-utils";

describe("files get command", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should show help when --help flag is passed", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runCLI(["files", "get", "--help"]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Get a specific file from the UCD API");
    expect(output).toContain("--base-url");
    expect(output).toContain("--output");
  });

  it("should error when no path is provided", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    await runCLI(["files", "get"]);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Path is required");
  });

  it("should get file content and output to stdout", async () => {
    const consoleInfoSpy = vi.spyOn(console, "info");
    const fileContent = "# Unicode Data File\n0041;LATIN CAPITAL LETTER A;Lu;";

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": () => {
          return HttpResponse.text(fileContent);
        },
      },
    });

    await runCLI(["files", "get", "16.0.0/UnicodeData.txt"]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain(fileContent);
  });

  it("should write file to output path when --output is specified", async () => {
    const consoleInfoSpy = vi.spyOn(console, "info");
    const fileContent = "# Unicode Data File\n0041;LATIN CAPITAL LETTER A;Lu;";
    const outputDir = await testdir();
    const outputPath = join(outputDir, "output.txt");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": () => {
          return HttpResponse.text(fileContent);
        },
      },
    });

    await runCLI(["files", "get", "16.0.0/UnicodeData.txt", "--output", outputPath]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("File written to:");

    // Verify file was actually written
    expect(existsSync(outputPath)).toBe(true);
    const writtenContent = readFileSync(outputPath, "utf-8");
    expect(writtenContent).toBe(fileContent);
  });

  it("should error when path is a directory not a file", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": () => {
          // Return array (directory listing) instead of string (file)
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

    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("is a directory, not a file");
  });

  it("should handle 404 error for non-existent file", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      responses: {
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

    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Error fetching file");
  });
});
