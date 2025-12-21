import NodeFileSystemBridge from "#internal:bridge/node";
import { IllegalCharacterInPathError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";

describe("control characters and null bytes", () => {
  describe("null byte attacks", () => {
    it("should reject paths with null bytes", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await expect(
        bridge.read("file.txt\0"),
      ).rejects.toThrow(IllegalCharacterInPathError);

      await expect(
        bridge.read("\0file.txt"),
      ).rejects.toThrow(IllegalCharacterInPathError);

      await expect(
        bridge.read("path/with\0null"),
      ).rejects.toThrow(IllegalCharacterInPathError);
    });
  });

  describe("control character attacks", () => {
    it("should reject paths with control characters", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Various control characters
      await expect(
        bridge.read("file\u0001.txt"),
      ).rejects.toThrow(IllegalCharacterInPathError);

      await expect(
        bridge.read("file\u0002.txt"),
      ).rejects.toThrow(IllegalCharacterInPathError);

      await expect(
        bridge.read("file\u001F.txt"),
      ).rejects.toThrow(IllegalCharacterInPathError);
    });
  });

  describe("newline and tab characters", () => {
    it("should handle newline characters in paths", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Newline should be rejected as control character
      await expect(
        bridge.read("file\n.txt"),
      ).rejects.toThrow(IllegalCharacterInPathError);
    });

    it("should handle tab characters in paths", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // Tab should be rejected as control character
      await expect(
        bridge.read("file\t.txt"),
      ).rejects.toThrow(IllegalCharacterInPathError);
    });
  });
});
