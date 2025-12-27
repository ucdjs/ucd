import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";
import { createFilesResource } from "../../src/resources/files";

describe("createFilesResource", () => {
  const baseUrl = UCDJS_API_BASE_URL;
  const endpoints = {
    files: "/api/v1/files",
    manifest: "/.well-known/ucd-store/{version}.json",
    versions: "/api/v1/versions",
  };

  describe("get()", () => {
    it("should fetch file content as text successfully", async () => {
      const fileContent = "# Unicode Data File\n0000;NULL;...";

      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/16.0.0/ucd/UnicodeData.txt`, () => {
          return HttpResponse.text(fileContent);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe(fileContent);
    });

    it("should fetch directory listing as JSON successfully", async () => {
      const directoryListing = [
        { type: "file", name: "UnicodeData.txt", path: "/16.0.0/ucd/UnicodeData.txt" },
        { type: "file", name: "PropList.txt", path: "/16.0.0/ucd/PropList.txt" },
      ];

      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/16.0.0/ucd`, () => {
          return HttpResponse.json(directoryListing);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("16.0.0/ucd");

      expect(error).toBeNull();
      expect(data).toEqual(directoryListing);
      expect(Array.isArray(data)).toBe(true);
    });

    it.each([
      "16.0.0/ucd/UnicodeData.txt",
      "15.1.0/ucd/emoji/emoji-data.txt",
      "latest/ucd/PropList.txt",
    ])("should handle file fetching for path %s", async (path) => {
      mockFetch([
        [
          "GET",
          `${baseUrl}${endpoints.files}/${path}`,
          () => HttpResponse.text(`Content of ${path}`),
        ],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get(path);

      expect(error).toBeNull();
      expect(data).toBe(`Content of ${path}`);
    });

    it("should handle 404 errors for non-existent files", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/99.0.0/ucd/NonExistent.txt`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("99.0.0/ucd/NonExistent.txt");

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 404);
    });

    it("should handle server errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/16.0.0/ucd/UnicodeData.txt`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error).toHaveProperty("status", 500);
    });

    it("should handle network errors", async () => {
      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/16.0.0/ucd/UnicodeData.txt`, () => {
          return HttpResponse.error();
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe("custom configuration", () => {
    it("should work with custom base URLs", async () => {
      const customBaseUrl = "https://custom-ucd-server.com";
      const fileContent = "Custom server content";

      mockFetch([
        ["GET", `${customBaseUrl}${endpoints.files}/16.0.0/ucd/UnicodeData.txt`, () => {
          return HttpResponse.text(fileContent);
        }],
      ]);

      const filesResource = createFilesResource({
        baseUrl: customBaseUrl,
        endpoints,
      });
      const { data, error } = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe(fileContent);
    });

    it("should work with custom files paths", async () => {
      const customFilesPath = "/v2/files";
      const fileContent = "Custom path content";

      mockFetch([
        ["GET", `${baseUrl}${customFilesPath}/16.0.0/ucd/UnicodeData.txt`, () => {
          return HttpResponse.text(fileContent);
        }],
      ]);

      const filesResource = createFilesResource({
        baseUrl,
        endpoints: {
          ...endpoints,
          files: customFilesPath,
        },
      });
      const { data, error } = await filesResource.get("16.0.0/ucd/UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBe(fileContent);
    });
  });

  describe("path traversal protection", () => {
    it("should reject paths with .. that traverse outside the endpoint", async () => {
      const filesResource = createFilesResource({ baseUrl, endpoints });

      // "../../../etc/passwd" from "/api/v1/files" resolves to "/etc/passwd"
      // which is outside "/api/v1/files", so it should be rejected
      const { data, error } = await filesResource.get("../../../etc/passwd");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(PathTraversalError);
    });

    it("should reject paths that try to access parent directories", async () => {
      const filesResource = createFilesResource({ baseUrl, endpoints });

      const { data, error } = await filesResource.get("16.0.0/../../secrets/api-key");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(PathTraversalError);
    });

    it("should reject encoded path traversal attempts", async () => {
      const filesResource = createFilesResource({ baseUrl, endpoints });

      // URL encoded ".." sequences
      const { data, error } = await filesResource.get("..%2F..%2F..%2Fetc%2Fpasswd");

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(PathTraversalError);
    });

    it("should allow valid nested paths", async () => {
      const fileContent = "Valid nested content";

      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/16.0.0/ucd/auxiliary/data.txt`, () => {
          return HttpResponse.text(fileContent);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("16.0.0/ucd/auxiliary/data.txt");

      expect(error).toBeNull();
      expect(data).toBe(fileContent);
    });

    it("should allow paths that contain .. in file/directory names (not as traversal)", async () => {
      const fileContent = "File with dots";

      mockFetch([
        ["GET", `${baseUrl}${endpoints.files}/16.0.0/ucd/test..file.txt`, () => {
          return HttpResponse.text(fileContent);
        }],
      ]);

      const filesResource = createFilesResource({ baseUrl, endpoints });
      const { data, error } = await filesResource.get("16.0.0/ucd/test..file.txt");

      expect(error).toBeNull();
      expect(data).toBe(fileContent);
    });
  });
});
