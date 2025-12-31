import type { ConsoleOutputCapture } from "../../__test-utils";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCLI } from "../../../src/cli-utils";
import { captureConsoleOutput } from "../../__test-utils";

describe("files list command", () => {
  let capture: ConsoleOutputCapture;

  beforeEach(() => {
    capture = captureConsoleOutput();
  });

  afterEach(() => {
    capture.restore();
  });

  it("should show help when --help flag is passed", async () => {
    await runCLI(["files", "list", "--help"]);

    expect(capture.containsInfo("List files and directories from the UCD API")).toBe(true);
    expect(capture.containsInfo("--base-url")).toBe(true);
    expect(capture.containsInfo("--json")).toBe(true);
  });

  it("should list files from API", async () => {
    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
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

    await runCLI(["files", "list"]);

    expect(capture.containsInfo("Directory listing:")).toBe(true);
  });

  it("should list files at specific path", async () => {
    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
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

    expect(capture.containsInfo("Directory listing:")).toBe(true);
    expect(capture.contains("16.0.0")).toBe(true);
  });

  it("should output JSON when --json flag is passed", async () => {
    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
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

    await runCLI(["files", "list", "--json"]);

    expect(capture.hasValidJson()).toBe(true);
    const json = capture.json<Array<{ type: string; name: string; path: string }>>();
    expect(json).toBeDefined();
    expect(json).toBeInstanceOf(Array);
    expect(json!.length).toBeGreaterThan(0);
    expect(json![0]).toHaveProperty("type");
    expect(json![0]).toHaveProperty("name");
    expect(json![0]).toHaveProperty("path");
  });

  it("should error when path is a file not a directory", async () => {
    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": () => {
          return HttpResponse.text("File content here");
        },
      },
    });

    await runCLI(["files", "list", "16.0.0/UnicodeData.txt"]);

    expect(capture.containsError("is a file, not a directory")).toBe(true);
  });

  it("should handle 404 error for non-existent path", async () => {
    mockStoreApi({
      responses: {
        "/.well-known/ucd-config.json": true,
        "/api/v1/versions": UNICODE_VERSION_METADATA,
        "/api/v1/files/{wildcard}": {
          status: 404,
          message: "Not found",
          timestamp: new Date().toISOString(),
        },
      },
    });

    await runCLI(["files", "list", "non-existent-path"]);

    expect(capture.containsError("Error fetching directory listing")).toBe(true);
  });
});
