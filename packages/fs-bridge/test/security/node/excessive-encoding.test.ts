import NodeFileSystemBridge from "#internal:bridge/node";
import { FailedToDecodePathError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";

describe("excessive encoding attacks", () => {
  describe("nested encoding attacks", () => {
    it("should prevent excessive nested encoding", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

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
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

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
