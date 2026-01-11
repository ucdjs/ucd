import HTTPFileSystemBridge from "#internal:bridge/http";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_STORE_BASE_URL } from "@ucdjs/env";
import { PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";

describe("path traversal security", () => {
  describe("http bridge - path traversal prevention", () => {
    describe("shallow pathname (/files)", () => {
      const baseUrl = `${UCDJS_STORE_BASE_URL}/files`;

      it("should prevent directory traversal attacks that go outside baseUrl.pathname", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Attempt to traverse outside baseUrl.pathname
        // These should throw PathTraversalError before making HTTP requests
        await expect(
          bridge.read("../../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);

        await expect(
          bridge.read("../../../root/.ssh/id_rsa"),
        ).rejects.toThrow(PathTraversalError);

        await expect(
          bridge.read("../outside/file.txt"),
        ).rejects.toThrow(PathTraversalError);
      });

      it("should allow upward traversal that stays within baseUrl.pathname", async () => {
        mockFetch([
          ["GET", `${UCDJS_STORE_BASE_URL}/files/file.txt`, () => {
            return new HttpResponse("root content", {
              status: 200,
              headers: { "Content-Type": "text/plain" },
            });
          }],
        ]);

        const bridge = HTTPFileSystemBridge({ baseUrl });

        // This should work - traverses up but stays within baseUrl.pathname
        const content = await bridge.read("subdir/../file.txt");
        expect(content).toBe("root content");
      });

      it("should prevent traversal with multiple levels going outside", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Multiple ../ that go outside
        await expect(
          bridge.read("deep/nested/../../../../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });

      it("should allow traversal within nested directories", async () => {
        mockFetch([
          ["GET", `${UCDJS_STORE_BASE_URL}/files/v15.1.0/file.txt`, () => {
            return new HttpResponse("v15 content", {
              status: 200,
              headers: { "Content-Type": "text/plain" },
            });
          }],
        ]);

        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Traverse from v16.0.0 to v15.1.0 - should work
        const content = await bridge.read("v16.0.0/../v15.1.0/file.txt");
        expect(content).toBe("v15 content");
      });

      it("should prevent traversal from root of baseUrl.pathname", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Try to go up from root
        await expect(
          bridge.read("../outside.txt"),
        ).rejects.toThrow(PathTraversalError);
      });
    });

    describe("deep pathname (/v16.0.0)", () => {
      const baseUrl = `${UCDJS_STORE_BASE_URL}/v16.0.0`;

      it("should prevent directory traversal attacks that go outside baseUrl.pathname", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Attempt to traverse outside baseUrl.pathname
        await expect(
          bridge.read("../../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);

        await expect(
          bridge.read("../../../root/.ssh/id_rsa"),
        ).rejects.toThrow(PathTraversalError);
      });

      it("should allow upward traversal that stays within baseUrl.pathname", async () => {
        mockFetch([
          ["GET", `${UCDJS_STORE_BASE_URL}/v16.0.0/file.txt`, () => {
            return new HttpResponse("file content", {
              status: 200,
              headers: { "Content-Type": "text/plain" },
            });
          }],
        ]);

        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Traverse up but stay within baseUrl.pathname
        const content = await bridge.read("subdir/../file.txt");
        expect(content).toBe("file content");
      });

      it("should prevent traversal that escapes to parent pathname segments", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Try to escape to root (parent of /v16.0.0)
        await expect(
          bridge.read("../../v15.1.0/file.txt"),
        ).rejects.toThrow(PathTraversalError);
      });

      it("should allow traversal within the deep pathname", async () => {
        mockFetch([
          ["GET", `${UCDJS_STORE_BASE_URL}/v16.0.0/subdir/file.txt`, () => {
            return new HttpResponse("subdir content", {
              status: 200,
              headers: { "Content-Type": "text/plain" },
            });
          }],
        ]);

        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Traverse within the deep pathname
        const content = await bridge.read("subdir/nested/../file.txt");
        expect(content).toBe("subdir content");
      });
    });
  });
});
