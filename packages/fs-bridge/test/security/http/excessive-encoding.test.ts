import HTTPFileSystemBridge from "#internal:bridge/http";
import { mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { FailedToDecodePathError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";

describe("excessive encoding attacks", () => {
  describe("nested encoding attacks", () => {
    describe("shallow pathname (/api/v1/files)", () => {
      const baseUrl = `${UCDJS_API_BASE_URL}/api/v1/files`;

      it("should prevent excessive nested encoding", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Create a path with excessive encoding (similar to MALICIOUS_INPUT in path-utils tests)
        let encodedPath = "æøå";
        for (let i = 0; i < 15; i++) {
          encodedPath = encodeURIComponent(encodedPath);
        }

        await expect(
          bridge.read(encodedPath),
        ).rejects.toThrow(FailedToDecodePathError);
      });

      it("should prevent excessive encoding in traversal attempts", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Excessive encoding of traversal
        let encodedTraversal = "../";
        for (let i = 0; i < 10; i++) {
          encodedTraversal = encodeURIComponent(encodedTraversal);
        }

        await expect(
          bridge.read(`${encodedTraversal}etc/passwd`),
        ).rejects.toThrow();
      });
    });

    describe("deep pathname (/api/v1/files/v16.0.0)", () => {
      const baseUrl = `${UCDJS_API_BASE_URL}/api/v1/files/v16.0.0`;

      it("should prevent excessive nested encoding", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Create a path with excessive encoding
        let encodedPath = "æøå";
        for (let i = 0; i < 15; i++) {
          encodedPath = encodeURIComponent(encodedPath);
        }

        await expect(
          bridge.read(encodedPath),
        ).rejects.toThrow(FailedToDecodePathError);
      });

      it("should prevent excessive encoding in traversal attempts", async () => {
        const bridge = HTTPFileSystemBridge({ baseUrl });

        // Excessive encoding of traversal
        let encodedTraversal = "../";
        for (let i = 0; i < 10; i++) {
          encodedTraversal = encodeURIComponent(encodedTraversal);
        }

        await expect(
          bridge.read(`${encodedTraversal}etc/passwd`),
        ).rejects.toThrow();
      });
    });
  });
});
