/// <reference types="../../../test-utils/src/matchers/types.d.ts" />

import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import {
  UCDStoreApiFallbackError,
  UCDStoreFilterError,
  UCDStoreGenericError,
  UCDStoreVersionNotFoundError,
} from "../../src/errors";
import { getFile } from "../../src/files/get";

describe("getFile", () => {
  const UNICODE_DATA_CONTENT = "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;";
  const SAMPLE_API_CONTENT = "# File fetched from API\n0041;LATIN CAPITAL LETTER A;Lu";

  describe("reading files from store", () => {
    it("should return file content when file exists in store", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_CONTENT,
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe(UNICODE_DATA_CONTENT);
    });

    it("should return content for files in nested subdirectories", async () => {
      const nestedContent = "# DerivedBidiClass data\n0000..0008;BN";
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/extracted/DerivedBidiClass.txt": nestedContent,
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "extracted/DerivedBidiClass.txt");

      expect(error).toBeNull();
      expect(data).toBe(nestedContent);
    });

    it("should read files from the correct version directory", async () => {
      const contentV16 = "# Unicode 16.0.0 ReadMe";
      const contentV15 = "# Unicode 15.0.0 ReadMe";

      const { context } = await createTestContext({
        versions: ["16.0.0", "15.0.0"],
        initialFiles: {
          "16.0.0/ReadMe.txt": contentV16,
          "15.0.0/ReadMe.txt": contentV15,
        },
      });

      const [data16, error16] = await getFile(context, "16.0.0", "ReadMe.txt");
      expect(error16).toBeNull();
      expect(data16).toBe(contentV16);

      const [data15, error15] = await getFile(context, "15.0.0", "ReadMe.txt");
      expect(error15).toBeNull();
      expect(data15).toBe(contentV15);
    });

    it("should handle empty file content", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/Empty.txt": "",
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "Empty.txt");

      expect(error).toBeNull();
      expect(data).toBe("");
    });

    it("should preserve unicode content in files", async () => {
      const unicodeContent = "# 你好世界 🌍\n# مرحبا بالعالم\n# Привет мир";

      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/Unicode.txt": unicodeContent,
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "Unicode.txt");

      expect(error).toBeNull();
      expect(data).toBe(unicodeContent);
    });
  });

  describe("version validation", () => {
    it("should return UCDStoreVersionNotFoundError when version is not resolved", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      // Try to get a file from version 15.0.0 (not in resolved versions)
      const [data, error] = await getFile(context, "15.0.0", "UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toMatchError({
        type: UCDStoreVersionNotFoundError,
        fields: {
          version: "15.0.0",
        },
      });
    });

    it("should work with any version in the resolved versions list", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
        initialFiles: {
          "15.1.0/ReadMe.txt": "Version 15.1.0",
        },
      });

      const [data, error] = await getFile(context, "15.1.0", "ReadMe.txt");

      expect(error).toBeNull();
      expect(data).toBe("Version 15.1.0");
    });
  });

  describe("filter validation", () => {
    it("should return UCDStoreFilterError when file matches global exclude filter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        globalFilters: {
          exclude: ["**/*.txt"],
        },
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_CONTENT,
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toMatchError({
        type: UCDStoreFilterError,
        fields: {
          filePath: "UnicodeData.txt",
        },
      });
    });

    it("should return UCDStoreFilterError when file does not match global include filter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        globalFilters: {
          include: ["ReadMe.txt"],
        },
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_CONTENT,
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreFilterError);
    });

    it("should respect method-specific exclude filters in options", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_CONTENT,
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        filters: {
          exclude: ["UnicodeData.txt"],
        },
      });

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreFilterError);
    });

    it("should allow files that pass all filters", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        globalFilters: {
          include: ["**/*.txt"],
          exclude: ["**/test/**"],
        },
        initialFiles: {
          "16.0.0/UnicodeData.txt": UNICODE_DATA_CONTENT,
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe(UNICODE_DATA_CONTENT);
    });
  });

  describe("file not found without API fallback", () => {
    it("should return error when file does not exist and allowApi is false (default)", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFile(context, "16.0.0", "NonExistent.txt");

      expect(data).toBeNull();
      expect(error).toMatchError({
        type: UCDStoreGenericError,
        // The error message comes from the implementation
        message: /does not exist/,
      });
    });

    it("should return error when file does not exist and allowApi is explicitly false", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFile(context, "16.0.0", "NonExistent.txt", {
        allowApi: false,
      });

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
    });
  });

  describe("api fallback (allowApi: true)", () => {
    it("should fetch file from API when file does not exist in store", async () => {
      let apiCalled = false;
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": () => {
            apiCalled = true;
            return HttpResponse.text(SAMPLE_API_CONTENT);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBe(SAMPLE_API_CONTENT);
      expect(apiCalled).toBe(true);
    });

    it("should prefer store file over API when file exists in store", async () => {
      let apiCalled = false;

      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": () => {
            apiCalled = true;
            return HttpResponse.text("API content - should NOT be used");
          },
        },
      });

      const storeContent = "Store content - should be used";
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/UnicodeData.txt": storeContent,
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "UnicodeData.txt", {
        allowApi: true,
      });

      expect(error).toBeNull();
      expect(data).toBe(storeContent);
      expect(apiCalled).toBe(false);
    });

    it("should return error when API fetch fails with 404", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": () => {
            return HttpResponse.json({
              status: 404,
              message: "File not found",
              timestamp: new Date().toISOString(),
            }, { status: 404 });
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFile(context, "16.0.0", "NonExistent.txt", {
        allowApi: true,
      });

      expect(data).toBeNull();
      expect(error).toMatchError({
        type: UCDStoreApiFallbackError,
        fields: {
          version: "16.0.0",
          filePath: "NonExistent.txt",
          reason: "fetch-failed",
          status: 404,
        },
      });
    });

    it("should handle JSON responses from API by stringifying them", async () => {
      const jsonData = { test: true, data: [1, 2, 3] };

      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": () => {
            // Return as text since the endpoint expects text/blob responses
            return HttpResponse.text(JSON.stringify(jsonData));
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFile(context, "16.0.0", "data.json", {
        allowApi: true,
      });

      expect(error).toBeNull();
      // The API returned JSON as text, so it comes back as-is
      expect(data).toBe(JSON.stringify(jsonData));
    });

    it("should return error when API returns null data", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": () => {
            return HttpResponse.json(null);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      const [data, error] = await getFile(context, "16.0.0", "File.txt", {
        allowApi: true,
      });

      expect(data).toBeNull();
      expect(error).toMatchError({
        type: UCDStoreApiFallbackError,
        fields: {
          version: "16.0.0",
          filePath: "File.txt",
          reason: "no-data",
        },
      });
    });
  });

  describe("api path construction", () => {
    it("should include ucd segment in API path for modern versions (>= 4.1.0)", async () => {
      let capturedPath = "";

      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": ({ params }) => {
            capturedPath = params.wildcard as string;
            return HttpResponse.text(SAMPLE_API_CONTENT);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      await getFile(context, "16.0.0", "UnicodeData.txt", { allowApi: true });

      expect(capturedPath).toBe("16.0.0/ucd/UnicodeData.txt");
    });

    it("should NOT include ucd segment in API path for legacy versions (< 4.1.0)", async () => {
      let capturedPath = "";

      mockStoreApi({
        versions: ["4.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": ({ params }) => {
            capturedPath = params.wildcard as string;
            return HttpResponse.text(SAMPLE_API_CONTENT);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["4.0.0"],
      });

      await getFile(context, "4.0.0", "UnicodeData.txt", { allowApi: true });

      expect(capturedPath).toBe("4.0.0/UnicodeData.txt");
    });

    it("should correctly join nested file paths for API requests", async () => {
      let capturedPath = "";

      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": ({ params }) => {
            capturedPath = params.wildcard as string;
            return HttpResponse.text(SAMPLE_API_CONTENT);
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["16.0.0"],
      });

      await getFile(context, "16.0.0", "extracted/DerivedAge.txt", { allowApi: true });

      expect(capturedPath).toBe("16.0.0/ucd/extracted/DerivedAge.txt");
    });
  });

  describe("call signature variations", () => {
    it("should work with explicit context parameter", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/ReadMe.txt": "Hello World",
        },
      });

      const [data, error] = await getFile(context, "16.0.0", "ReadMe.txt");

      expect(error).toBeNull();
      expect(data).toBe("Hello World");
    });

    it("should work with bound context using Function.bind()", async () => {
      const { context } = await createTestContext({
        versions: ["16.0.0"],
        initialFiles: {
          "16.0.0/ReadMe.txt": "Hello Bound",
        },
      });

      const boundGetFile = getFile.bind(context);
      const [data, error] = await boundGetFile("16.0.0", "ReadMe.txt");

      expect(error).toBeNull();
      expect(data).toBe("Hello Bound");
    });
  });
});
