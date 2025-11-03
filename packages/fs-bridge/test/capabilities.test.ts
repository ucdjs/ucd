import type { FileSystemBridgeOperations } from "../src/types";
import { assert, describe, expect, it, vi } from "vitest";
import { assertCapability, BridgeUnsupportedOperation, hasCapability } from "../src";
import { defineFileSystemBridge } from "../src/define";

function createTemporaryTestBridge(capabilities: {
  write?: boolean;
  mkdir?: boolean;
  rm?: boolean;
}) {
  const operations: FileSystemBridgeOperations = {
    read: vi.fn().mockResolvedValue("content"),
    exists: vi.fn().mockResolvedValue(true),
    listdir: vi.fn().mockResolvedValue([]),
  };

  if (capabilities.write) operations.write = vi.fn().mockResolvedValue(undefined);
  if (capabilities.mkdir) operations.mkdir = vi.fn().mockResolvedValue(undefined);
  if (capabilities.rm) operations.rm = vi.fn().mockResolvedValue(undefined);

  const bridge = defineFileSystemBridge({
    meta: { name: "Test Bridge", description: "Test" },
    setup: () => operations,
  });

  return bridge();
}

describe("capabilities", () => {
  describe("capability detection", () => {
    it("should detect no optional capabilities for read-only bridge", () => {
      const bridge = defineFileSystemBridge({
        meta: {
          name: "Read-Only Bridge",
          description: "A read-only bridge",
        },
        setup: () => ({
          read: vi.fn().mockResolvedValue("content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const fs = bridge();
      expect(fs.optionalCapabilities).toEqual({
        write: false,
        mkdir: false,
        rm: false,
      });
    });

    it("should detect all optional capabilities when provided", () => {
      const bridge = defineFileSystemBridge({
        meta: {
          name: "Full Bridge",
          description: "A bridge with all capabilities",
        },
        setup: () => ({
          read: vi.fn().mockResolvedValue("content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
          write: vi.fn().mockResolvedValue(undefined),
          mkdir: vi.fn().mockResolvedValue(undefined),
          rm: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const fs = bridge();
      expect(fs.optionalCapabilities).toEqual({
        write: true,
        mkdir: true,
        rm: true,
      });
    });

    it("should detect partial capabilities", () => {
      const bridge = defineFileSystemBridge({
        meta: {
          name: "Partial Bridge",
          description: "A bridge with partial capabilities",
        },
        setup: () => ({
          read: vi.fn().mockResolvedValue("content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
          write: vi.fn().mockResolvedValue(undefined),
          // only write capability, no mkdir or rm
        }),
      });

      const fs = bridge();
      expect(fs.optionalCapabilities).toEqual({
        write: true,
        mkdir: false,
        rm: false,
      });
    });
  });

  describe("assertCapability", () => {
    it("should pass when capability exists", () => {
      const fs = createTemporaryTestBridge({ write: true });
      expect(() => assertCapability(fs, "write")).not.toThrow();
    });

    it("should throw BridgeUnsupportedOperation when capability missing", () => {
      const fs = createTemporaryTestBridge({ write: false });

      expect(() => assertCapability(fs, "write")).toThrow(BridgeUnsupportedOperation);
      expect(() => assertCapability(fs, "write")).toThrow(
        "File system bridge does not support the 'write' capability.",
      );
    });

    it("should pass when all capabilities in array exist", () => {
      const fs = createTemporaryTestBridge({ write: true, mkdir: true, rm: true });
      expect(() => assertCapability(fs, ["write", "mkdir", "rm"])).not.toThrow();
    });

    it("should throw for first missing capability in array", () => {
      const fs = createTemporaryTestBridge({ write: true, mkdir: false, rm: false });

      try {
        assertCapability(fs, ["write", "mkdir", "rm"]);

        expect.fail("Expected assertCapability to throw BridgeUnsupportedOperation, since 'mkdir' & 'rm' are missing");
      } catch (err: unknown) {
        assert.instanceOf(err, BridgeUnsupportedOperation);
        expect(err.capability).toBe("mkdir");
        expect(err.message).toBe(
          "File system bridge does not support the 'mkdir' capability.",
        );
      }
    });
  });

  describe("hasCapability", () => {
    it("should return true for single supported capability", () => {
      const fs = createTemporaryTestBridge({ write: true });
      expect(hasCapability(fs, "write")).toBe(true);
    });

    it("should return false for single unsupported capability", () => {
      const fs = createTemporaryTestBridge({ write: false });
      expect(hasCapability(fs, "write")).toBe(false);
      expect(hasCapability(fs, "mkdir")).toBe(false);
      expect(hasCapability(fs, "rm")).toBe(false);
    });

    it("should return true when all capabilities in array are supported", () => {
      const fs = createTemporaryTestBridge({ write: true, mkdir: true, rm: true });
      expect(hasCapability(fs, ["write", "mkdir"])).toBe(true);
      expect(hasCapability(fs, ["write", "mkdir", "rm"])).toBe(true);
    });

    it("should return false when any capability in array is unsupported", () => {
      const fs = createTemporaryTestBridge({ write: true, mkdir: false });
      expect(hasCapability(fs, ["write", "mkdir"])).toBe(false);
      expect(hasCapability(fs, ["write"])).toBe(true);
    });

    it("should work as type guard", () => {
      const fs = createTemporaryTestBridge({ write: true, mkdir: true });

      if (hasCapability(fs, "write")) {
        expect(fs.write).toBeDefined();
      }

      if (hasCapability(fs, ["write", "mkdir"])) {
        expect(fs.write).toBeDefined();
        expect(fs.mkdir).toBeDefined();
      }
    });
  });

  describe("unsupported operation handling", () => {
    it("should throw synchronously for sync bridges when calling unsupported operation", () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Sync Read-Only", description: "Sync read-only bridge" },
        setup: () => ({
          read: (_path: string) => "content",
          exists: (_path: string) => true,
          listdir: (_path: string) => [],
        }),
      });

      const fs = bridge();

      // Sync bridge should throw synchronously
      expect(fs.meta.isAsyncMode).toBe(false);
      expect(() => fs.write?.("test.txt", "content")).toThrow(BridgeUnsupportedOperation);
      expect(() => fs.mkdir?.("dir")).toThrow(BridgeUnsupportedOperation);
      expect(() => fs.rm?.("file.txt")).toThrow(BridgeUnsupportedOperation);
    });

    it("should return rejected Promise for async bridges when calling unsupported operation", async () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Async Read-Only", description: "Async read-only bridge" },
        setup: () => ({
          read: async (_path: string) => "content",
          exists: async (_path: string) => true,
          listdir: async (_path: string) => [],
        }),
      });

      const fs = bridge();

      expect(fs.meta.isAsyncMode).toBe(true);
      await expect(fs.write?.("test.txt", "content")).rejects.toThrow(BridgeUnsupportedOperation);
      await expect(fs.mkdir?.("dir")).rejects.toThrow(BridgeUnsupportedOperation);
      await expect(fs.rm?.("file.txt")).rejects.toThrow(BridgeUnsupportedOperation);
    });

    it("should allow supported operations to work in sync mode", () => {
      const readMock = vi.fn().mockReturnValue("test content");
      const bridge = defineFileSystemBridge({
        meta: { name: "Sync Test", description: "Sync test bridge" },
        setup: () => ({
          read: readMock,
          exists: (_path: string) => true,
          listdir: (_path: string) => [],
        }),
      });

      const fs = bridge();

      expect(fs.meta.isAsyncMode).toBe(false);

      const result = fs.read("test.txt");
      expect(result).toBe("test content");
      expect(readMock).toHaveBeenCalledWith("test.txt");

      expect(() => fs.write?.("test.txt", "content")).toThrow();
    });

    it("should allow supported operations to work in async mode", async () => {
      const readMock = vi.fn().mockResolvedValue("test content");
      const bridge = defineFileSystemBridge({
        meta: { name: "Async Test", description: "Async test bridge" },
        setup: () => ({
          read: readMock,
          exists: async (_path: string) => true,
          listdir: async (_path: string) => [],
        }),
      });

      const fs = bridge();

      expect(fs.meta.isAsyncMode).toBe(true);

      const result = await fs.read("test.txt");
      expect(result).toBe("test content");
      expect(readMock).toHaveBeenCalledWith("test.txt");

      await expect(fs.write?.("test.txt", "content")).rejects.toThrow();
    });
  });
});
