import { describe, expect, it } from "vitest";
import { mockStoreApi } from "../../../src/mock-store";

describe("handler: /api/v1/files/{wildcard}", () => {
  describe("default response", () => {
    it("should return default text content", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/files/{wildcard}": true,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/16.0.0/ucd/ArabicShaping.txt",
      );
      expect(response.ok).toBe(true);

      const text = await response.text();
      expect(text).toContain("ArabicShaping");
    });

    it("should handle wildcard paths", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/files/{wildcard}": true,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/16.0.0/ucd/extracted/DerivedBidiClass.txt",
      );
      expect(response.ok).toBe(true);
    });
  });

  describe("custom response", () => {
    it("should accept custom text content", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/files/{wildcard}": "custom content",
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/test.txt",
      );
      const text = await response.text();

      expect(text).toBe("custom content");
    });

    it("should accept binary content (ArrayBuffer)", async () => {
      const buffer = new Uint8Array([1, 2, 3, 4]).buffer;

      mockStoreApi({
        responses: {
          "/api/v1/files/{wildcard}": buffer,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/binary.dat",
      );
      const data = await response.arrayBuffer();

      expect(new Uint8Array(data)).toEqual(new Uint8Array([1, 2, 3, 4]));
    });

    it("should accept binary content (Uint8Array)", async () => {
      const uint8 = new Uint8Array([5, 6, 7, 8]);

      mockStoreApi({
        responses: {
          "/api/v1/files/{wildcard}": uint8,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/binary.dat",
      );
      const data = await response.arrayBuffer();

      expect(new Uint8Array(data)).toEqual(uint8);
    });

    it("should accept FileEntryList for directory listings", async () => {
      const fileList = [
        {
          type: "file" as const,
          name: "test.txt",
          path: "test.txt",
          lastModified: 123456,
        },
        {
          type: "directory" as const,
          name: "subdir",
          path: "subdir",
          lastModified: 123457,
        },
      ];

      mockStoreApi({
        responses: {
          "/api/v1/files/{wildcard}": fileList,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/files/directory/",
      );
      const data = await response.json();

      expect(data).toEqual(fileList);
    });
  });
});
