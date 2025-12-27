import NodeFileSystemBridge from "#internal:bridge/node";
import { UNCPathNotSupportedError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { BridgeSetupError } from "../../../src/errors";

// eslint-disable-next-line test/prefer-lowercase-title
describe("UNC path prevention", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("UNC path rejection", () => {
    it("should reject UNC paths in basePath", () => {
      expect(() => {
        NodeFileSystemBridge({ basePath: "\\\\server\\share" });
      }).toThrow(BridgeSetupError);

      // Verify the error is due to UNC path
      try {
        NodeFileSystemBridge({ basePath: "\\\\server\\share" });
        expect.fail("Should have thrown");
      } catch (error: any) {
        // The error should be BridgeSetupError wrapping UNCPathNotSupportedError
        expect(error).toBeInstanceOf(BridgeSetupError);
        expect(error.originalError).toBeInstanceOf(UNCPathNotSupportedError);
      }
    });

    it("should reject UNC paths in input paths", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      await expect(
        bridge.read("\\\\server\\share\\file.txt"),
      ).rejects.toThrow(UNCPathNotSupportedError);
    });
  });

  describe("encoded UNC paths", () => {
    it("should reject encoded UNC paths", async () => {
      const testDir = await testdir({
        "file.txt": "content",
      });
      const bridge = NodeFileSystemBridge({ basePath: testDir });

      // UNC paths should be rejected even if encoded
      // Note: This depends on how resolveSafePath handles encoded UNC paths
      // The decodePathSafely should decode it first, then assertNotUNCPath should catch it
      await expect(
        bridge.read("%5c%5cserver%5cshare%5cfile.txt"),
      ).rejects.toThrow();
    });
  });
});
