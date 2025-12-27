import NodeFileSystemBridge from "#internal:bridge/node";
import { PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";

describe("encoded attack vectors", () => {
  describe("uRL-encoded traversal attacks", () => {
    it("should prevent encoded traversal that goes outside basePath", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // %2e%2e%2f = ../
      await expect(
        bridge.read("%2e%2e%2f%2e%2e%2fetc%2fpasswd"),
      ).rejects.toThrow(PathTraversalError);

      // Double encoded
      await expect(
        bridge.read("%252e%252e%252f%252e%252e%252fetc"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should allow encoded traversal that stays within basePath", async () => {
      const testDir = await testdir({
        "subdir": {
          "file.txt": "content",
        },
        "file.txt": "root content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // %2e%2e%2f = ../, but stays within basePath
      const content = await bridge.read("subdir%2f%2e%2e%2ffile.txt");
      expect(content).toBe("root content");
    });

    it("should prevent Unicode-encoded traversal attacks", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // \u002E = .
      await expect(
        bridge.read("\u002E\u002E/\u002E\u002E/etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });
  });

  describe("mixed encoding attacks", () => {
    it("should prevent mixed encoding traversal attacks", async () => {
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
  });

  describe("excessive encoding", () => {
    it("should prevent excessive encoding attacks", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Create a path with excessive encoding
      let encodedPath = "..";
      for (let i = 0; i < 10; i++) {
        encodedPath = encodeURIComponent(encodedPath);
      }

      await expect(
        bridge.read(encodedPath),
      ).rejects.toThrow();
    });
  });
});
