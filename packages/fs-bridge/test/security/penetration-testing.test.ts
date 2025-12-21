import HTTPFileSystemBridge from "#internal:bridge/http";
import NodeFileSystemBridge from "#internal:bridge/node";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { IllegalCharacterInPathError, PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";

describe("penetration testing - advanced attack vectors", () => {
  describe("node bridge - advanced attacks", () => {
    it("should prevent null byte injection attacks", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await expect(
        bridge.read("file.txt\0"),
      ).rejects.toThrow(IllegalCharacterInPathError);

      await expect(
        bridge.read("\0../../etc/passwd"),
      ).rejects.toThrow(IllegalCharacterInPathError);
    });

    it("should prevent control character injection", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Try various control characters
      await expect(
        bridge.read("file.txt\u0001"),
      ).rejects.toThrow(IllegalCharacterInPathError);

      await expect(
        bridge.read("file.txt\u0007"), // Bell character
      ).rejects.toThrow(IllegalCharacterInPathError);

      await expect(
        bridge.read("file.txt\u001F"), // Unit separator
      ).rejects.toThrow(IllegalCharacterInPathError);
    });

    it("should handle Unicode normalization attacks", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Try Unicode variants of dots and slashes
      // Zero-width spaces might be normalized or treated as part of path
      // The path should still be caught if it traverses outside
      await expect(
        bridge.read("..\u200B/../etc/passwd"), // Zero-width space
      ).rejects.toThrow();

      await expect(
        bridge.read("\uFEFF../etc/passwd"), // Zero-width no-break space
      ).rejects.toThrow();
    });

    it("should prevent path traversal with mixed case attacks", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // On case-insensitive systems, these might be normalized differently
      // But resolveSafePath should still catch traversal
      await expect(
        bridge.read("..\\..\\etc\\passwd"), // Windows-style backslashes
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../..\\etc/passwd"), // Mixed separators
      ).rejects.toThrow(PathTraversalError);
    });

    it("should prevent extremely long path attacks", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Create extremely long path with traversal
      const longPath = `${"../".repeat(1000)}etc/passwd`;

      await expect(
        bridge.read(longPath),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should prevent path traversal with redundant segments", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Redundant segments that might confuse naive implementations
      await expect(
        bridge.read("././.././../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("subdir/../subdir/../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("a/../b/../c/../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should prevent path traversal with encoded null bytes", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // %00 is null byte
      await expect(
        bridge.read("file.txt%00"),
      ).rejects.toThrow();

      await expect(
        bridge.read("%00../../etc/passwd"),
      ).rejects.toThrow();
    });

    it("should handle protocol-relative URLs", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Protocol-relative URLs (//) are treated as absolute paths
      // In the virtual filesystem model, absolute paths are relative to basePath
      // So "//etc/passwd" becomes "/etc/passwd" which is treated as relative
      // This should resolve to basePath/etc/passwd, not throw traversal error
      // But the file doesn't exist, so it will throw file not found
      await expect(
        bridge.read("//etc/passwd"),
      ).rejects.toThrow();
    });

    it("should prevent path traversal with Windows drive letter attacks", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Try to access different drive (Windows)
      await expect(
        bridge.read("C:/Windows/System32/config/sam"),
      ).rejects.toThrow();
    });

    it("should prevent path traversal with symlink-like attacks", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Even if symlinks exist, traversal should be blocked
      await expect(
        bridge.read("symlink/../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });
  });

  describe("http bridge - advanced attacks", () => {
    const baseUrl = `${UCDJS_API_BASE_URL}/api/v1/files`;

    it("should prevent null byte injection attacks", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      await expect(
        bridge.read("file.txt\0"),
      ).rejects.toThrow(IllegalCharacterInPathError);

      await expect(
        bridge.read("\0../../etc/passwd"),
      ).rejects.toThrow(IllegalCharacterInPathError);
    });

    it("should prevent control character injection", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      await expect(
        bridge.read("file.txt\u0001"),
      ).rejects.toThrow(IllegalCharacterInPathError);
    });

    it("should handle Unicode normalization attacks", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Zero-width spaces might be normalized or treated as part of path
      await expect(
        bridge.read("..\u200B/../etc/passwd"), // Zero-width space
      ).rejects.toThrow();
    });

    it("should prevent extremely long path attacks", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      const longPath = `${"../".repeat(1000)}etc/passwd`;

      await expect(
        bridge.read(longPath),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should handle protocol-relative URLs", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Protocol-relative URLs (//) are treated as absolute paths
      // In the virtual filesystem model, they're relative to baseUrl.pathname
      // This should be caught by resolveSafePath
      await expect(
        bridge.read("//etc/passwd"),
      ).rejects.toThrow();
    });

    it("should handle URL manipulation attacks", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Try to manipulate URL structure
      // ? and # are treated as part of the path string
      // resolveSafePath should handle them
      await expect(
        bridge.read("?../../etc/passwd"),
      ).rejects.toThrow();

      await expect(
        bridge.read("#../../etc/passwd"),
      ).rejects.toThrow();
    });

    it("should prevent path traversal with query string injection attempts", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Query strings are part of the path and should be caught by resolveSafePath
      // The ? character itself might be treated as part of the path
      await expect(
        bridge.read("file.txt?../../etc/passwd"),
      ).rejects.toThrow();
    });

    it("should prevent path traversal with fragment injection attempts", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Fragments are part of the path and should be caught by resolveSafePath
      // The # character itself might be treated as part of the path
      await expect(
        bridge.read("file.txt#../../etc/passwd"),
      ).rejects.toThrow();
    });

    it("should prevent path traversal with authority injection attempts", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Try to inject authority (user@host)
      await expect(
        bridge.read("@evil.com/../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should prevent path traversal with port injection attempts", async () => {
      const bridge = HTTPFileSystemBridge({ baseUrl });

      // Try to inject port
      await expect(
        bridge.read(":8080/../../etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });
  });

  describe("edge case attacks", () => {
    it("should handle empty string after trimming", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Empty string should resolve to basePath
      const exists = await bridge.exists("   ");
      expect(exists).toBe(true);
    });

    it("should handle paths with only dots (not traversal)", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // "..." is not a traversal sequence, it's just an invalid filename
      // It should fail with file not found, not PathTraversalError
      await expect(
        bridge.read("..."),
      ).rejects.toThrow();
    });

    it("should handle paths with mixed dots and slashes", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // ".../.../etc/passwd" creates a path within basePath, not traversal
      // It should fail with file not found, not PathTraversalError
      await expect(
        bridge.read(".../.../etc/passwd"),
      ).rejects.toThrow();

      await expect(
        bridge.read("..../..../etc/passwd"),
      ).rejects.toThrow();
    });

    it("should prevent traversal with percent-encoded dots", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // %2E is encoded dot
      await expect(
        bridge.read("%2E%2E/%2E%2E/etc/passwd"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should prevent traversal with backslash-encoded paths", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // %5C is encoded backslash
      await expect(
        bridge.read("..%5C..%5Cetc%5Cpasswd"),
      ).rejects.toThrow(PathTraversalError);
    });
  });

  describe("boundary condition attacks", () => {
    it("should prevent traversal at exact boundary", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Try to go exactly one level up
      await expect(
        bridge.read(".."),
      ).rejects.toThrow(PathTraversalError);

      await expect(
        bridge.read("../"),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should allow traversal within boundary", async () => {
      const testDir = await testdir({
        "subdir": {
          "file.txt": "subdir content",
        },
        "file.txt": "root content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // This should work - stays within boundary
      const content = await bridge.read("subdir/../file.txt");
      expect(content).toBe("root content");
    });

    it("should prevent traversal that goes exactly one character outside", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Try to access parent directory
      await expect(
        bridge.read("../"),
      ).rejects.toThrow(PathTraversalError);
    });
  });
});
