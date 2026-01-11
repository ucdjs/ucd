import HTTPFileSystemBridge from "#internal:bridge/http";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_STORE_BASE_URL } from "@ucdjs/env";
import { PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";

describe("encoded attack vectors", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("URL-encoded traversal attacks", () => {
    describe("shallow pathname (/files)", () => {
      const baseUrl = `${UCDJS_STORE_BASE_URL}/files`;

      it("should prevent encoded traversal that goes outside baseUrl.pathname", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // %2e%2e%2f = ../
        await expect(
          bridge.read("%2e%2e%2f%2e%2e%2fetc%2fpasswd"),
        ).rejects.toThrow(PathTraversalError);

        // Double encoded
        await expect(
          bridge.read("%252e%252e%252f%252e%252e%252fetc"),
        ).rejects.toThrow(PathTraversalError);
      });

      it("should allow encoded traversal that stays within baseUrl.pathname", async () => {
        mockFetch([
          ["GET", `${UCDJS_STORE_BASE_URL}/files/file.txt`, () => {
            return new HttpResponse("root content", {
              status: 200,
              headers: { "Content-Type": "text/plain" },
            });
          }],
        ]);

        const bridge = HTTPFileSystemBridge({ baseUrl });

        // %2e%2e%2f = ../, but stays within baseUrl.pathname
        const content = await bridge.read("subdir%2f%2e%2e%2ffile.txt");
        expect(content).toBe("root content");
      });

      it("should prevent Unicode-encoded traversal attacks", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // \u002E = .
        await expect(
          bridge.read("\u002E\u002E/\u002E\u002E/etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });
    });

    describe("deep pathname (/v16.0.0)", () => {
      const baseUrl = `${UCDJS_STORE_BASE_URL}/v16.0.0`;

      it("should prevent encoded traversal that goes outside baseUrl.pathname", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // %2e%2e%2f = ../
        await expect(
          bridge.read("%2e%2e%2f%2e%2e%2fetc%2fpasswd"),
        ).rejects.toThrow(PathTraversalError);

        // Double encoded
        await expect(
          bridge.read("%252e%252e%252f%252e%252e%252fetc"),
        ).rejects.toThrow(PathTraversalError);
      });

      it("should allow encoded traversal that stays within baseUrl.pathname", async () => {
        mockFetch([
          ["GET", `${UCDJS_STORE_BASE_URL}/v16.0.0/file.txt`, () => {
            return new HttpResponse("file content", {
              status: 200,
              headers: { "Content-Type": "text/plain" },
            });
          }],
        ]);

        const bridge = HTTPFileSystemBridge({ baseUrl });

        // %2e%2e%2f = ../, but stays within baseUrl.pathname
        const content = await bridge.read("subdir%2f%2e%2e%2ffile.txt");
        expect(content).toBe("file content");
      });
    });
  });

  describe("mixed encoding attacks", () => {
    describe("shallow pathname (/files)", () => {
      const baseUrl = `${UCDJS_STORE_BASE_URL}/files`;

      it("should prevent mixed encoding traversal attacks", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Mix of encoded and plain traversal
        await expect(
          bridge.read("..%2f..%2fetc%2fpasswd"),
        ).rejects.toThrow(PathTraversalError);

        await expect(
          bridge.read("%2e%2e/../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });
    });

    describe("deep pathname (/v16.0.0)", () => {
      const baseUrl = `${UCDJS_STORE_BASE_URL}/v16.0.0`;

      it("should prevent mixed encoding traversal attacks", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Mix of encoded and plain traversal
        await expect(
          bridge.read("..%2f..%2fetc%2fpasswd"),
        ).rejects.toThrow(PathTraversalError);

        await expect(
          bridge.read("%2e%2e/../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });
    });
  });

  describe("excessive encoding", () => {
    describe("shallow pathname (/files)", () => {
      const basePath = "/files";
      const baseUrl = `${UCDJS_STORE_BASE_URL}/files`;

      it("should prevent excessive encoding attacks", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Create a path with excessive encoding
        let encodedPath = "..";
        for (let i = 0; i < 10; i++) {
          encodedPath = encodeURIComponent(encodedPath);
        }

        await expect(
          bridge.read(encodedPath),
        ).rejects.toThrow(`Path traversal detected: attempted to access '/' which is outside the allowed base path '${basePath}'`);
      });
    });

    describe("deep pathname (/16.0.0)", () => {
      const basePath = "/16.0.0";
      const baseUrl = `${UCDJS_STORE_BASE_URL}${basePath}`;

      it("should prevent excessive encoding attacks", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Create a path with excessive encoding
        let encodedPath = "..";
        for (let i = 0; i < 10; i++) {
          encodedPath = encodeURIComponent(encodedPath);
        }

        await expect(
          bridge.read(encodedPath),
        ).rejects.toThrow(`Path traversal detected: attempted to access '/' which is outside the allowed base path '${basePath}'`);
      });
    });
  });
});
