import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCLI } from "../../../src/cli-utils";

describe("files list command", () => {
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

    await runCLI(["files", "list", "--help"]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.flat().join("\n");
    expect(output).toContain("List files and directories from the UCD API");
    expect(output).toContain("--base-url");
    expect(output).toContain("--json");
  });

  it("should list files from API", async () => {
    const consoleInfoSpy = vi.spyOn(console, "info");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": () => {
          return HttpResponse.json([
            {
              type: "directory",
              name: "16.0.0",
              path: "16.0.0",
              lastModified: 1752862620000,
            },
            {
              type: "directory",
              name: "15.1.0",
              path: "15.1.0",
              lastModified: 1752862620000,
            },
          ]);
        },
      },
    });

    // Use a path that matches the wildcard pattern
    await runCLI(["files", "list"]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Directory listing:");
  });

  it("should list files at specific path", async () => {
    const consoleInfoSpy = vi.spyOn(console, "info");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": ({ params }) => {
          const path = params.wildcard as string;
          if (path === "16.0.0") {
            return HttpResponse.json([
              {
                type: "directory",
                name: "ucd",
                path: "16.0.0/ucd",
                lastModified: 1752862620000,
              },
              {
                type: "file",
                name: "UnicodeData.txt",
                path: "16.0.0/UnicodeData.txt",
                lastModified: 1752862620000,
              },
            ]);
          }

          return HttpResponse.json([]);
        },
      },
    });

    await runCLI(["files", "list", "16.0.0"]);

    const infoOutput = consoleInfoSpy.mock.calls.flat().join("\n");
    expect(infoOutput).toContain("Directory listing:");
    expect(infoOutput).toContain("16.0.0");
  });

  it("should output JSON when --json flag is passed", async () => {
    const consoleInfoSpy = vi.spyOn(console, "info");
    const stdoutSpy = vi.spyOn(process.stdout, "write");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": () => {
          return HttpResponse.json([
            {
              type: "directory",
              name: "16.0.0",
              path: "16.0.0",
              lastModified: 1752862620000,
            },
          ]);
        },
      },
    });

    // Use a path that matches the wildcard pattern
    await runCLI(["files", "list", "--json"]);

    expect(consoleInfoSpy).not.toHaveBeenCalled();

    // Find the JSON output in the console.info calls
    const output = stdoutSpy.mock.calls.flat();
    const jsonOutput = output.find((output) => {
      if (typeof output !== "string") return false;
      try {
        const parsed = JSON.parse(output);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    });

    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput as string);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0]).toHaveProperty("type");
    expect(parsed[0]).toHaveProperty("name");
    expect(parsed[0]).toHaveProperty("path");
  });

  it("should error when path is a file not a directory", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": () => {
          // Return string content (file) instead of array (directory)
          return HttpResponse.text("File content here");
        },
      },
    });

    await runCLI(["files", "list", "16.0.0/UnicodeData.txt"]);

    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("is a file, not a directory");
  });

  it("should handle 404 error for non-existent path", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    mockStoreApi({
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": {
          status: 404,
          message: "Not found",
          timestamp: new Date().toISOString(),
        },
      },
    });

    await runCLI(["files", "list", "non-existent-path"]);

    const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
    expect(errorOutput).toContain("Error fetching directory listing");
  });
});
