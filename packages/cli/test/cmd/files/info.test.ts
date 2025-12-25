import process from "node:process";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCLI } from "../../../src/cli-utils";

// TODO: The mockStoreApi only sets up GET handlers for /api/v1/files/{wildcard}.
// The files info command uses HEAD requests. Add HEAD handler support to mockStoreApi
// or update these tests once that's available.

describe("files info command", () => {
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

    await runCLI(["files", "info", "--help"]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.flat().join("\n");
    expect(output).toContain("Get metadata about a file or directory");
    expect(output).toContain("--base-url");
    expect(output).toContain("--json");
  });

  it("should get file metadata from API", async () => {
    const consoleInfoSpy = vi.spyOn(console, "info");

    mockStoreApi({
      customResponses: [
        ["HEAD", "https://api.ucdjs.dev/api/v1/files/16.0.0/UnicodeData.txt", () => {
          return new HttpResponse(null, {
            status: 200,
            headers: {
              [UCD_FILE_STAT_TYPE_HEADER]: "file",
              "Content-Type": "text/plain",
              "Last-Modified": "Wed, 18 Sep 2024 12:00:00 GMT",
              "Content-Length": "12345",
            },
          });
        }],
      ],
    });

    await runCLI(["files", "info", "16.0.0/UnicodeData.txt"]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("File info:");
    expect(infoOutput).toContain("16.0.0/UnicodeData.txt");
    expect(infoOutput).toContain("file");
  });

  it("should get directory metadata from API", async () => {
    const consoleInfoSpy = vi.spyOn(console, "info");

    mockStoreApi({
      customResponses: [
        ["HEAD", "https://api.ucdjs.dev/api/v1/files/16.0.0", () => {
          return new HttpResponse(null, {
            status: 200,
            headers: {
              [UCD_FILE_STAT_TYPE_HEADER]: "directory",
              "Content-Type": "application/json",
              "Last-Modified": "Wed, 18 Sep 2024 12:00:00 GMT",
            },
          });
        }],
      ],
    });

    await runCLI(["files", "info", "16.0.0"]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("File info:");
    expect(infoOutput).toContain("directory");
  });

  it("should output JSON when --json flag is passed", async () => {
    // Capture stdout.write for JSON output
    let stdoutOutput = "";
    const stdoutWriteSpy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdoutOutput += chunk;
      return true;
    });

    mockStoreApi({
      customResponses: [
        ["HEAD", "https://api.ucdjs.dev/api/v1/files/16.0.0/UnicodeData.txt", () => {
          return new HttpResponse(null, {
            status: 200,
            headers: {
              [UCD_FILE_STAT_TYPE_HEADER]: "file",
              "Content-Type": "text/plain",
              "Last-Modified": "Wed, 18 Sep 2024 12:00:00 GMT",
              "Content-Length": "12345",
            },
          });
        }],
      ],
    });

    await runCLI(["files", "info", "16.0.0/UnicodeData.txt", "--json"]);

    expect(stdoutOutput).toBeTruthy();
    const parsed = JSON.parse(stdoutOutput.trim());
    expect(parsed).toHaveProperty("path", "16.0.0/UnicodeData.txt");
    expect(parsed).toHaveProperty("type", "file");
    expect(parsed).toHaveProperty("contentType", "text/plain");
    expect(parsed).toHaveProperty("lastModified");
    expect(parsed).toHaveProperty("contentLength", "12345");

    stdoutWriteSpy.mockRestore();
  });

  it("should handle 404 error for non-existent path", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      customResponses: [
        ["HEAD", "https://api.ucdjs.dev/api/v1/files/non-existent-path", () => {
          return HttpResponse.json(
            { status: 404, message: "Not found", timestamp: new Date().toISOString() },
            { status: 404 },
          );
        }],
      ],
    });

    await runCLI(["files", "info", "non-existent-path"]);

    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Error fetching file info");
  });

  it("should show root directory info when no path is provided", async () => {
    const consoleInfoSpy = vi.spyOn(console, "info");

    mockStoreApi({
      customResponses: [
        ["HEAD", "https://api.ucdjs.dev/api/v1/files/", () => {
          return new HttpResponse(null, {
            status: 200,
            headers: {
              [UCD_FILE_STAT_TYPE_HEADER]: "directory",
              "Content-Type": "application/json",
            },
          });
        }],
      ],
    });

    await runCLI(["files", "info"]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("File info:");
    expect(infoOutput).toContain("(root)");
  });
});
