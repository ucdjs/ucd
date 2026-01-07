/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import HTTPFileSystemBridge from "#internal:bridge/http";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { BridgeGenericError } from "@ucdjs/fs-bridge";
import { PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";

describe("recursive listdir security", () => {
  describe("should prevent traversal via entry.path in recursive listdir", () => {
    const baseUrl = `${UCDJS_API_BASE_URL}/api/v1/files`;

    it("should prevent traversal when entry.path contains ../", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Mock initial listdir response with malicious entry.path
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files`, () => {
          return new HttpResponse(JSON.stringify([
            {
              type: "directory",
              name: "malicious",
              path: "/../../etc/", // Malicious traversal in entry.path
              lastModified: Date.now(),
            },
          ]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      // When recursive listdir tries to fetch children of the malicious directory,
      // it should call listdir with joinURL("", "../../etc") which becomes "../../etc"
      // This should be caught by resolveSafePath and throw PathTraversalError
      await expect(
        bridge.listdir("", true),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should reject encoded traversal via Zod schema validation (defense in depth)", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Mock initial listdir response with encoded traversal in entry.path
      // The encoded path doesn't conform to the schema (doesn't start with /, doesn't end with /)
      // This is caught by Zod validation BEFORE traversal detection - defense in depth
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files`, () => {
          return new HttpResponse(JSON.stringify([
            {
              type: "directory",
              name: "malicious",
              path: "%2f%2e%2e%2f%2e%2e%2fetc%2f", // Encoded traversal - rejected by schema
              lastModified: Date.now(),
            },
          ]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      // Zod schema validation rejects malformed paths before traversal check
      // This is actually defense-in-depth - malicious paths are rejected at schema level
      await expect(
        bridge.listdir("", true),
      ).rejects.toMatchError({
        type: BridgeGenericError,
        message: /Invalid response schema/,
      });
    });

    it("should allow legitimate nested directories", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Mock legitimate nested directory structure
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files`, () => {
          return new HttpResponse(JSON.stringify([
            {
              type: "directory",
              name: "subdir",
              path: "/subdir/",
              lastModified: Date.now(),
            },
          ]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/subdir`, () => {
          return new HttpResponse(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      // This should work - legitimate nested directory
      const entries = await bridge.listdir("", true);
      expect(entries).toHaveLength(1);
      expect(entries?.[0]?.type).toBe("directory");
      expect(entries?.[0]?.path).toBe("/subdir/");
    });
  });
});
