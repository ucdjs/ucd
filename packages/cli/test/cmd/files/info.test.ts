import type { ConsoleOutputCapture } from "../../__test-utils";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UCD_FILE_STAT_TYPE_HEADER } from "@ucdjs/env";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCLI } from "../../../src/cli-utils";
import { captureConsoleOutput } from "../../__test-utils";

describe("files info command", () => {
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    const helpCapture = captureConsoleOutput();
    await runCLI(["files", "info", "--help"]);

    expect(helpCapture.contains("Get metadata about a file or directory")).toBe(true);
    expect(helpCapture.contains("--base-url")).toBe(true);
    expect(helpCapture.contains("--json")).toBe(true);

    helpCapture.restore();
  });

  it("should get file metadata from API", async () => {
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

    expect(capture.containsInfo("File info:")).toBe(true);
    expect(capture.containsInfo("16.0.0/UnicodeData.txt")).toBe(true);
    expect(capture.containsInfo("file")).toBe(true);
  });

  it("should get directory metadata from API", async () => {
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

    expect(capture.containsInfo("File info:")).toBe(true);
    expect(capture.containsInfo("directory")).toBe(true);
  });

  it("should output JSON when --json flag is passed", async () => {
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

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<{ path: string; type: string }>();
    expect(json).toHaveProperty("path", "16.0.0/UnicodeData.txt");
    expect(json).toHaveProperty("type", "file");
    expect(json).toHaveProperty("contentType", "text/plain");
    expect(json).toHaveProperty("lastModified");
    expect(json).toHaveProperty("contentLength", "12345");
  });

  it("should handle 404 error for non-existent path", async () => {
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

    expect(capture.containsError("Error fetching file info")).toBe(true);
  });

  it("should show root directory info when no path is provided", async () => {
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

    expect(capture.containsInfo("File info:")).toBe(true);
    expect(capture.containsInfo("(root)")).toBe(true);
  });
});
