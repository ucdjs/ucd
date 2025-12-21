import HTTPFileSystemBridge from "#internal:bridge/http";
import { mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";

describe("mixed attack vectors", () => {
  describe("combined traversal and encoding attacks", () => {
    describe("shallow pathname (/api/v1/files)", () => {
      const baseUrl = `${UCDJS_API_BASE_URL}/api/v1/files`;

      it("should prevent combined encoded and plain traversal", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Mix of encoded and plain traversal
        await expect(
          bridge.read("..%2f..%2fetc%2fpasswd"),
        ).rejects.toThrow(PathTraversalError);

        await expect(
          bridge.read("%2e%2e/../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });

      it("should prevent traversal with mixed separators", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Mix of forward and backslashes
        await expect(
          bridge.read("..\\..\\etc\\passwd"),
        ).rejects.toThrow(PathTraversalError);

        await expect(
          bridge.read("../..\\etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });
    });

    describe("deep pathname (/api/v1/files/v16.0.0)", () => {
      const baseUrl = `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0`;

      it("should prevent combined encoded and plain traversal", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Mix of encoded and plain traversal
        await expect(
          bridge.read("..%2f..%2fetc%2fpasswd"),
        ).rejects.toThrow(PathTraversalError);

        await expect(
          bridge.read("%2e%2e/../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });

      it("should prevent traversal with mixed separators", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Mix of forward and backslashes
        await expect(
          bridge.read("..\\..\\etc\\passwd"),
        ).rejects.toThrow(PathTraversalError);

        await expect(
          bridge.read("../..\\etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });
    });
  });

  describe("complex attack scenarios", () => {
    describe("shallow pathname (/api/v1/files)", () => {
      const baseUrl = `${UCDJS_API_BASE_URL}/api/v1/files`;

      it("should prevent deeply nested traversal attempts", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Try to escape from deep nesting
        await expect(
          bridge.read("deep/nested/very/deep/../../../../../../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });

      it("should prevent traversal with redundant path segments", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Redundant segments
        await expect(
          bridge.read("./.././../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);

        await expect(
          bridge.read("subdir/../subdir/../../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });
    });

    describe("deep pathname (/api/v1/files/v16.0.0)", () => {
      const baseUrl = `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0`;

      it("should prevent deeply nested traversal attempts", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Try to escape from deep nesting
        await expect(
          bridge.read("deep/nested/very/deep/../../../../../../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });

      it("should prevent traversal with redundant path segments", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Redundant segments
        await expect(
          bridge.read("./.././../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);

        await expect(
          bridge.read("subdir/../subdir/../../etc/passwd"),
        ).rejects.toThrow(PathTraversalError);
      });
    });
  });
});
