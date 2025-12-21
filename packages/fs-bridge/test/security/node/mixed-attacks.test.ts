import NodeFileSystemBridge from "#internal:bridge/node";
import { IllegalCharacterInPathError, PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";

describe("mixed attack vectors", () => {
  describe("combined traversal and encoding attacks", () => {
    it("should prevent combined encoded and plain traversal", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Mix of encoded and plain traversal
      await expect(
        bridge.read("..%2f..%2fetc%2fpasswd"),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("%2e%2e/../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should prevent traversal with mixed separators", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Mix of forward and backslashes
      await expect(
        bridge.read("..\\..\\etc\\passwd"),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../..\\etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });
  });

  describe("complex attack scenarios", () => {
    it("should prevent deeply nested traversal attempts", async () => {
      const testDir = await testdir({
        deep: {
          nested: {
            very: {
              deep: {
                "file.txt": "content",
              },
            },
          },
        },
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Try to escape from deep nesting
      await expect(
        bridge.read("deep/nested/very/deep/../../../../../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should prevent traversal with redundant path segments", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

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
