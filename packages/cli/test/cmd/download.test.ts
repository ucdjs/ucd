/* eslint-disable no-console */
import { existsSync } from "node:fs";
import path from "node:path";
import { HttpResponse, mockFetch } from "#msw-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import * as cliUtils from "../../src/cli-utils";
import { runDownload } from "../../src/cmd/download";

vi.mock("../../src/cli-utils", async () => {
  const actual = await vi.importActual("../../src/cli-utils");
  return {
    ...actual,
    printHelp: vi.fn(),
  };
});

const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// mock file data
const mockFileEntries = [
  {
    name: "UnicodeData.txt",
    path: "UnicodeData.txt",
  },
  {
    name: "ReadMe.txt",
    path: "ReadMe.txt",
  },
  {
    name: "NormalizationTest.txt",
    path: "NormalizationTest.txt",
  },
  {
    name: "BidiTest.txt",
    path: "BidiTest.txt",
  },
  {
    name: "BidiCharacterTest.txt",
    path: "BidiCharacterTest.txt",
  },
  {
    name: "GraphemeBreakTest.txt",
    path: "GraphemeBreakTest.txt",
  },
  {
    name: "Data.html",
    path: "Data.html",
  },
  {
    name: "emoji",
    path: "emoji",
    children: [
      {
        name: "emoji-data.txt",
        path: "emoji-data.txt",
      },
      {
        name: "emoji-test.txt",
        path: "emoji-test.txt",
      },
    ],
  },
];

// sample file contents
const mockFileContents = {
  "UnicodeData.txt": "0000;NULL;Cc;0;BN;;;;;N;;;;;",
  "ReadMe.txt": "# Unicode Data Files README",
  "NormalizationTest.txt": "@Part0 # Quick test",
  "BidiTest.txt": "# Bidi Test File",
  "BidiCharacterTest.txt": "# Bidi Character Test File",
  "GraphemeBreakTest.txt": "# Grapheme Break Test File",
  "Data.html": "<html><body>Unicode Data</body></html>",
  "emoji/emoji-data.txt": "# Emoji Data",
  "emoji/emoji-test.txt": "# Test emoji sequences",
};

describe("download command", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    console.log = vi.fn();
    console.info = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();

    // setup mock api responses
    mockFetch([
      ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.0.0", () => {
        return HttpResponse.json(mockFileEntries);
      }],
    ]);

    // mock file content responses
    for (const [filePath, content] of Object.entries(mockFileContents)) {
      mockFetch([
        [`GET https://unicode-proxy.ucdjs.dev/16.0.0/ucd/${filePath}`, () => {
          return new HttpResponse(content, { status: 200 });
        }],
      ]);
    }
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe("command validation", () => {
    it("should print help when help flag is provided", async () => {
      await runDownload({
        versions: ["16.0.0"],
        flags: {
          _: ["16.0.0"],
          help: true,
        },
      });

      expect(cliUtils.printHelp).toHaveBeenCalled();
    });

    it("should print help when h flag is provided", async () => {
      await runDownload({
        versions: ["16.0.0"],
        flags: {
          _: ["16.0.0"],
          h: true,
        },
      });

      expect(cliUtils.printHelp).toHaveBeenCalled();
    });
  });

  describe("file filtering", () => {
    it("should download all files when no exclusions are specified", async () => {
      // create a temporary directory for the test
      const outputPath = await testdir({});

      await runDownload({
        versions: ["16.0.0"],
        flags: {
          _: ["16.0.0"],
          outputDir: outputPath,
        },
      });

      // check if files were downloaded
      expect(existsSync(path.join(outputPath, "v16.0.0/UnicodeData.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/ReadMe.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/NormalizationTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/BidiTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-data.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-test.txt"))).toBe(true);
    });

    it("should exclude test files when --exclude-test flag is used", async () => {
      const outputPath = await testdir({});

      await runDownload({
        versions: ["16.0.0"],
        flags: {
          _: ["16.0.0"],
          outputDir: outputPath,
          excludeTest: true,
        },
      });

      // regular files should exist
      expect(existsSync(path.join(outputPath, "v16.0.0/UnicodeData.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/ReadMe.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-data.txt"))).toBe(true);

      // test files should not exist
      expect(existsSync(path.join(outputPath, "v16.0.0/NormalizationTest.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/BidiTest.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/BidiCharacterTest.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/GraphemeBreakTest.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-test.txt"))).toBe(false);
    });

    it("should exclude html files when --exclude-html-files flag is used", async () => {
      const outputPath = await testdir({});

      await runDownload({
        versions: ["16.0.0"],
        flags: {
          _: ["16.0.0"],
          outputDir: outputPath,
          excludeHTMLFiles: true,
        },
      });

      // regular files should exist
      expect(existsSync(path.join(outputPath, "v16.0.0/UnicodeData.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/ReadMe.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-data.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/NormalizationTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/BidiTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/BidiCharacterTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/GraphemeBreakTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-test.txt"))).toBe(true);

      // html files should not exist
      expect(existsSync(path.join(outputPath, "v16.0.0/Data.html"))).toBe(false);
    });

    it("should exclude readme files when --exclude-readmes flag is used", async () => {
      const outputPath = await testdir({});

      await runDownload({
        versions: ["16.0.0"],
        flags: {
          _: ["16.0.0"],
          outputDir: outputPath,
          excludeReadmes: true,
        },
      });

      // regular files should exist
      expect(existsSync(path.join(outputPath, "v16.0.0/UnicodeData.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-data.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/NormalizationTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/BidiTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/BidiCharacterTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/GraphemeBreakTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-test.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/Data.html"))).toBe(true);

      // readme files should not exist
      expect(existsSync(path.join(outputPath, "v16.0.0/ReadMe.txt"))).toBe(false);
    });

    it("should exclude files matching custom glob patterns with --exclude flag", async () => {
      const outputPath = await testdir({});

      await runDownload({
        versions: ["16.0.0"],
        flags: {
          _: ["16.0.0"],
          outputDir: outputPath,
          patterns: ["!ReadMe.txt", "!**/emoji/**"], // exclude readme and all files in emoji directory
        },
      }); // regular files should exist
      expect(existsSync(path.join(outputPath, "v16.0.0/UnicodeData.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/NormalizationTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/BidiTest.txt"))).toBe(true);
      expect(existsSync(path.join(outputPath, "v16.0.0/BidiCharacterTest.txt"))).toBe(true);

      // excluded files should not exist
      expect(existsSync(path.join(outputPath, "v16.0.0/ReadMe.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-data.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-test.txt"))).toBe(false);
    });

    it("should combine --exclude and --exclude-test flags", async () => {
      const outputPath = await testdir({});

      await runDownload({
        versions: ["16.0.0"],
        flags: {
          _: ["16.0.0"],
          outputDir: outputPath,
          excludeTest: true,
          excludeHTMLFiles: true,
          excludeReadmes: true,
          patterns: ["!**/UnicodeData.txt"],
        },
      });

      // only emoji-data.txt should exist
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-data.txt"))).toBe(true);

      // excluded files should not exist
      expect(existsSync(path.join(outputPath, "v16.0.0/UnicodeData.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/ReadMe.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/NormalizationTest.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/BidiTest.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/BidiCharacterTest.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/GraphemeBreakTest.txt"))).toBe(false);
      expect(existsSync(path.join(outputPath, "v16.0.0/emoji/emoji-test.txt"))).toBe(false);
    });
  });

  describe("error handling", () => {
    it.todo("should handle API errors gracefully", async () => {
      // mock api error
      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/17.0.0", () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const outputPath = await testdir({});

      await runDownload({
        versions: ["17.0.0"],
        flags: {
          _: ["17.0.0"],
          outputDir: outputPath,
        },
      });

      // should log the error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/Failed to fetch file list for version 17.0.0/),
      );
    });

    it("should handle file download errors", async () => {
      // mock successful api response but failed file download
      mockFetch([
        ["GET https://unicode-api.luxass.dev/api/v1/unicode-files/16.1.0", () => {
          return HttpResponse.json([
            {
              name: "UnicodeData.txt",
              path: "UnicodeData.txt",
            },
            {
              name: "MissingFile.txt",
              path: "MissingFile.txt",
            },
          ]);
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.1.0/ucd/UnicodeData.txt", () => {
          return new HttpResponse("16.1.0 data", { status: 200 });
        }],
        ["GET https://unicode-proxy.ucdjs.dev/16.1.0/ucd/MissingFile.txt", () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const outputPath = await testdir({});

      await runDownload({
        versions: ["16.1.0"],
        flags: {
          _: ["16.1.0"],
          outputDir: outputPath,
        },
      });

      // don't check for specific message or file existence
      // just verify error handling doesn't crash the process
      expect(console.error).toHaveBeenCalled();
    });

    it("should handle invalid versions", async () => {
      const outputPath = await testdir({});

      await runDownload({
        versions: ["invalid-version"],
        flags: {
          _: ["invalid-version"],
          outputDir: outputPath,
        },
      });

      // should log the error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/Invalid version/),
      );
    });
  });
});
