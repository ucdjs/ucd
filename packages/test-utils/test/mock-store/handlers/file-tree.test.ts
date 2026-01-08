import type { UnicodeFileTree } from "@ucdjs/schemas";
import { HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { mockStoreApi } from "../../../src/mock-store";

describe("handler: /api/v1/versions/{version}/file-tree", () => {
  describe("default response", () => {
    it("should return default file tree", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions/{version}/file-tree": true,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree",
      );
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toMatchObject({
        type: "file",
        name: "ArabicShaping.txt",
      });
    });
  });

  describe("custom response", () => {
    it("should accept custom file tree data", async () => {
      const customTree = [
        {
          type: "file" as const,
          name: "custom.txt",
          path: "custom.txt",
          lastModified: 123456,
        },
      ];

      mockStoreApi({
        responses: {
          "/api/v1/versions/{version}/file-tree": customTree,
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree",
      );
      const data = await response.json();

      expect(data).toEqual(customTree);
    });

    it("should accept custom resolver with path params", async () => {
      mockStoreApi({
        responses: {
          "/api/v1/versions/{version}/file-tree": vi.fn(async ({ params }) => {
            const tree: UnicodeFileTree = [
              {
                type: "file" as const,
                name: `test-${params.version}.txt`,
                path: `test-${params.version}.txt`,
                lastModified: 0,
              },
            ];

            return HttpResponse.json<UnicodeFileTree>(tree);
          }),
        },
      });

      const response = await fetch(
        "https://api.ucdjs.dev/api/v1/versions/1.0.0/file-tree",
      );
      const data = await response.json();

      expect(data[0].name).toBe("test-1.0.0.txt");
    });
  });
});
