import HTTPFileSystemBridge from "#internal:bridge/http";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_STORE_BASE_URL } from "@ucdjs/env";
import { PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";

describe("boundary enforcement", () => {
  describe("shallow pathname (/files)", () => {
    const baseUrl = `${UCDJS_STORE_BASE_URL}/files`;

    it("should enforce boundary for shallow pathname", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Should prevent traversal outside baseUrl.pathname
      await expect(
        bridge.read("../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../outside.txt"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should allow operations within shallow pathname", async () => {
      mockFetch([
        ["GET", `${UCDJS_STORE_BASE_URL}/files/subdir/file.txt`, () => {
          return new HttpResponse("content", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      const content = await bridge.read("subdir/file.txt");
      expect(content).toBe("content");
    });

    it("should prevent traversal at boundary root", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Try to go up from root
      await expect(
        bridge.read(".."),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should allow traversal within nested directories", async () => {
      mockFetch([
        ["GET", `${UCDJS_STORE_BASE_URL}/files/level1/file.txt`, () => {
          return new HttpResponse("level1 content", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Traverse up one level but stay within baseUrl.pathname
      const content = await bridge.read("level1/level2/../file.txt");
      expect(content).toBe("level1 content");
    });
  });

  describe("deep pathname (/v16.0.0)", () => {
    const baseUrl = `${UCDJS_STORE_BASE_URL}/v16.0.0`;

    it("should enforce boundary for deep pathname", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Should prevent traversal outside baseUrl.pathname
      await expect(
        bridge.read("../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../outside.txt"),
      ).rejects.toThrow(PathTraversalError);

      // Should prevent traversal to parent pathname segments
      await expect(
        bridge.read("../../v15.1.0/file.txt"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should allow operations within deep pathname", async () => {
      mockFetch([
        ["GET", `${UCDJS_STORE_BASE_URL}/v16.0.0/subdir/file.txt`, () => {
          return new HttpResponse("content", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      const content = await bridge.read("subdir/file.txt");
      expect(content).toBe("content");
    });

    it("should prevent traversal at boundary root", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Try to go up from root of deep pathname
      await expect(
        bridge.read(".."),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should allow traversal within nested directories of deep pathname", async () => {
      mockFetch([
        ["GET", `${UCDJS_STORE_BASE_URL}/v16.0.0/level1/file.txt`, () => {
          return new HttpResponse("level1 content", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }],
      ]);

      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Traverse up one level but stay within baseUrl.pathname
      const content = await bridge.read("level1/level2/../file.txt");
      expect(content).toBe("level1 content");
    });

    it("should prevent traversal that escapes to parent pathname segments", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Try to escape to root (parent of /v16.0.0)
      await expect(
        bridge.read("../../v15.1.0/file.txt"),
      ).rejects.toThrow(PathTraversalError);

      // Try to escape to root (grandparent)
      await expect(
        bridge.read("../../../other/path"),
      ).rejects.toThrow(PathTraversalError);
    });
  });

  describe("boundary edge cases", () => {
    describe("shallow pathname (/files)", () => {
      const baseUrl = `${UCDJS_STORE_BASE_URL}/files`;

      it("should handle root reference correctly", async () => {
        mockFetch([
          ["GET", `${UCDJS_STORE_BASE_URL}/files`, () => {
            return new HttpResponse(JSON.stringify([]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const bridge = HTTPFileSystemBridge({ baseUrl });

        const entries = await bridge.listdir("/");
        expect(entries).toEqual([]);
      });

      it("should handle current directory reference correctly", async () => {
        mockFetch([
          ["GET", `${UCDJS_STORE_BASE_URL}/files`, () => {
            return new HttpResponse(JSON.stringify([]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const bridge = HTTPFileSystemBridge({ baseUrl });

        const entries = await bridge.listdir(".");
        expect(entries).toEqual([]);
      });
    });

    describe("deep pathname (/v16.0.0)", () => {
      const baseUrl = `${UCDJS_STORE_BASE_URL}/v16.0.0`;

      it("should handle root reference correctly", async () => {
        mockFetch([
          ["GET", `${UCDJS_STORE_BASE_URL}/v16.0.0`, () => {
            return new HttpResponse(JSON.stringify([]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const bridge = HTTPFileSystemBridge({ baseUrl });

        const entries = await bridge.listdir("/");
        expect(entries).toEqual([]);
      });

      it("should handle current directory reference correctly", async () => {
        mockFetch([
          ["GET", `${UCDJS_STORE_BASE_URL}/v16.0.0`, () => {
            return new HttpResponse(JSON.stringify([]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const bridge = HTTPFileSystemBridge({ baseUrl });

        const entries = await bridge.listdir(".");
        expect(entries).toEqual([]);
      });
    });
  });
});
