import type { FileSystemBridgeOperations } from "../src/types";
import { assert, describe, expect, it, vi } from "vitest";
import { assertCapability, BridgeUnsupportedOperation } from "../src";
import { defineFileSystemBridge } from "../src/define";

describe("capability inference", () => {
  it("should infer capabilities from returned operations", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Capability Inference Bridge",
        description: "A mock file system bridge to test capability inference",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        exists: vi.fn().mockResolvedValue(true),
        // write, listdir, mkdir, rm not returned
      }),
    });

    const fs = bridge();
    expect(fs.capabilities).toEqual({
      read: true,
      exists: true,
      write: false,
      listdir: false,
      mkdir: false,
      rm: false,
    });
  });

  it("should infer all capabilities when all operations are provided", () => {
    const mockOperations: FileSystemBridgeOperations = {
      read: vi.fn().mockResolvedValue("content"),
      write: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
      listdir: vi.fn().mockResolvedValue([]),
      mkdir: vi.fn().mockResolvedValue(undefined),
      rm: vi.fn().mockResolvedValue(undefined),
    };

    const bridge = defineFileSystemBridge({
      meta: {
        name: "Full Capability Bridge",
        description: "A mock file system bridge with all operations",
      },
      setup: () => mockOperations,
    });

    const fs = bridge();
    expect(fs.capabilities).toEqual({
      read: true,
      write: true,
      exists: true,
      listdir: true,
      mkdir: true,
      rm: true,
    });
  });

  it("should handle partial capability sets", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Partial Capability Bridge",
        description: "A mock file system bridge with partial operations",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        write: vi.fn().mockResolvedValue(undefined),
        // only read and write capabilities
      }),
    });

    const fs = bridge();
    expect(fs.capabilities).toEqual({
      read: true,
      write: true,
      exists: false,
      listdir: false,
      mkdir: false,
      rm: false,
    });
  });

  it("should handle empty operation set", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Empty Operations Bridge",
        description: "A mock file system bridge with no operations",
      },
      setup: () => ({}), // no operations
    });

    const fs = bridge();
    expect(fs.capabilities).toEqual({
      read: false,
      write: false,
      exists: false,
      listdir: false,
      mkdir: false,
      rm: false,
    });
  });

  it("should handle operations that are null or undefined", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Null Undefined Operations Bridge",
        description: "A mock file system bridge with null/undefined operations",
      },
      setup: () => ({
        read: undefined as any,
        write: null as any,
        exists: vi.fn().mockResolvedValue(true),
      }),
    });

    const fs = bridge();
    expect(fs.capabilities).toEqual({
      read: false,
      write: false,
      exists: true,
      listdir: false,
      mkdir: false,
      rm: false,
    });
  });

  it("should handle read-only filesystem pattern", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Read-Only Bridge",
        description: "A mock file system bridge with read-only operations",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue([]),
        // no write, mkdir, rm operations
      }),
    });

    const fs = bridge();
    expect(fs.capabilities).toEqual({
      read: true,
      exists: true,
      listdir: true,
      write: false,
      mkdir: false,
      rm: false,
    });
  });

  it("should handle write-only filesystem pattern", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Write-Only Bridge",
        description: "A mock file system bridge with write-only operations",
      },
      setup: () => ({
        write: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        // no read, listdir, rm operations
      }),
    });

    const fs = bridge();
    expect(fs.capabilities).toEqual({
      read: false,
      write: true,
      exists: true,
      listdir: false,
      mkdir: true,
      rm: false,
    });
  });
});

describe("assertCapability function", () => {
  const createMockBridge = (capabilities: Record<string, boolean>) => {
    const operations: Partial<FileSystemBridgeOperations> = {};

    // Add mock operations based on capabilities
    if (capabilities.read) operations.read = vi.fn().mockResolvedValue("content");
    if (capabilities.write) operations.write = vi.fn().mockResolvedValue(undefined);
    if (capabilities.exists) operations.exists = vi.fn().mockResolvedValue(true);
    if (capabilities.listdir) operations.listdir = vi.fn().mockResolvedValue([]);
    if (capabilities.mkdir) operations.mkdir = vi.fn().mockResolvedValue(undefined);
    if (capabilities.rm) operations.rm = vi.fn().mockResolvedValue(undefined);

    const bridge = defineFileSystemBridge({
      meta: {
        name: "Mock Bridge",
        description: "A mock file system bridge for testing assertCapability",
      },
      setup: () => operations,
    });

    return bridge();
  };

  it("should pass when single capability is available", () => {
    const bridge = createMockBridge({ read: true });
    expect(() => assertCapability(bridge, "read")).not.toThrow();
  });

  it("should throw when single capability is missing", () => {
    const bridge = createMockBridge({ read: false });
    expect(() => assertCapability(bridge, "read")).toThrow(BridgeUnsupportedOperation);
  });

  it("should pass when all capabilities in array are available", () => {
    const bridge = createMockBridge({ read: true, write: true, exists: true });
    expect(() => assertCapability(bridge, ["read", "write", "exists"])).not.toThrow();
  });

  it("should throw when any capability in array is missing", () => {
    const bridge = createMockBridge({ read: true, write: false });
    expect(() => assertCapability(bridge, ["read", "write"])).toThrow(BridgeUnsupportedOperation);
  });

  it("should throw descriptive error with capability name", () => {
    const bridge = createMockBridge({ write: false });

    try {
      assertCapability(bridge, "write");
      expect.fail("Should have thrown");
    } catch (error) {
      assert(error instanceof BridgeUnsupportedOperation);
      expect(error.message).toBe("File system bridge does not support the 'write' capability.");
      expect((error as BridgeUnsupportedOperation).capability).toBe("write");
    }
  });

  it("should throw for first missing capability in array", () => {
    const bridge = createMockBridge({ read: true, write: false, exists: false });

    try {
      assertCapability(bridge, ["read", "write", "exists"]);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(BridgeUnsupportedOperation);
      expect((error as BridgeUnsupportedOperation).capability).toBe("write");
    }
  });

  it("should work with all capability types", () => {
    const bridge = createMockBridge({
      read: true,
      write: true,
      exists: true,
      listdir: true,
      mkdir: true,
      rm: true,
    });

    expect(() => assertCapability(bridge, "read")).not.toThrow();
    expect(() => assertCapability(bridge, "write")).not.toThrow();
    expect(() => assertCapability(bridge, "exists")).not.toThrow();
    expect(() => assertCapability(bridge, "listdir")).not.toThrow();
    expect(() => assertCapability(bridge, "mkdir")).not.toThrow();
    expect(() => assertCapability(bridge, "rm")).not.toThrow();
  });

  it("should handle empty capability array", () => {
    const bridge = createMockBridge({ read: true });
    expect(() => assertCapability(bridge, [])).not.toThrow();
  });
});

describe("proxy error handling", () => {
  it("should throw descriptive error for unsupported write operation", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Write Error Bridge",
        description: "A mock file system bridge that throws in write operation",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        // no write operation
      }),
    });

    const fs = bridge();
    expect(() => fs.write?.("test.txt", "content")).toThrow(
      "File system bridge does not support the 'write' capability.",
    );
  });

  it("should throw descriptive error for unsupported mkdir operation", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Mkdir Error Bridge",
        description: "A mock file system bridge that throws in mkdir operation",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        // no mkdir operation
      }),
    });

    const fs = bridge();
    expect(() => fs.mkdir?.("new-dir")).toThrow(
      "File system bridge does not support the 'mkdir' capability.",
    );
  });

  it("should throw descriptive error for unsupported rm operation", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "RM Error Bridge",
        description: "A mock file system bridge that throws in rm operation",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        // no rm operation
      }),
    });

    const fs = bridge();
    expect(() => fs.rm?.("test.txt")).toThrow(
      "File system bridge does not support the 'rm' capability.",
    );
  });

  it("should throw descriptive error for unsupported listdir operation", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Listdir Error Bridge",
        description: "A mock file system bridge that throws in listdir operation",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        // no listdir operation
      }),
    });

    const fs = bridge();
    expect(() => fs.listdir?.("dir")).toThrow(
      "File system bridge does not support the 'listdir' capability.",
    );
  });

  it("should throw descriptive error for unsupported exists operation", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Exists Error Bridge",
        description: "A mock file system bridge that throws in exists operation",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        // no exists operation
      }),
    });

    const fs = bridge();
    expect(() => fs.exists?.("test.txt")).toThrow(
      "File system bridge does not support the 'exists' capability.",
    );
  });

  it("should allow supported operations to work normally", async () => {
    const mockRead = vi.fn().mockResolvedValue("test content");
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Read Operation Bridge",
        description: "A mock file system bridge with read operation",
      },
      setup: () => ({
        read: mockRead,
      }),
    });

    const fs = bridge();
    assertCapability(fs, "read");
    const result = await fs.read("test.txt");

    expect(result).toBe("test content");
    expect(mockRead).toHaveBeenCalledWith("test.txt");
  });

  it("should handle mixed supported and unsupported operations", async () => {
    const mockRead = vi.fn().mockResolvedValue("content");
    const mockExists = vi.fn().mockResolvedValue(true);

    const bridge = defineFileSystemBridge({
      meta: {
        name: "Mixed Operations Bridge",
        description: "A mock file system bridge with mixed operations",
      },
      setup: () => ({
        read: mockRead,
        exists: mockExists,
        // no write, listdir, mkdir, rm
      }),
    });

    const fs = bridge();

    assertCapability(fs, ["read", "exists"]);
    // supported operations should work
    await expect(fs.read("test.txt")).resolves.toBe("content");
    await expect(fs.exists("test.txt")).resolves.toBe(true);

    // unsupported operations should throw
    expect(() => fs.write?.("test.txt", "content")).toThrow();
    expect(() => fs.listdir?.("dir")).toThrow();
    expect(() => fs.mkdir?.("dir")).toThrow();
    expect(() => fs.rm?.("test.txt")).toThrow();
  });

  it("should not interfere with capabilities property access", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Capabilities Access Bridge",
        description: "A mock file system bridge to test capabilities access",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
      }),
    });

    const fs = bridge();

    expect(fs.capabilities).toEqual({
      read: true,
      write: false,
      exists: false,
      listdir: false,
      mkdir: false,
      rm: false,
    });
  });

  it("should handle concurrent unsupported operation calls", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Concurrent Unsupported Bridge",
        description: "A mock file system bridge to test concurrent unsupported operations",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        // no write operation
      }),
    });

    const fs = bridge();
    // multiple calls to unsupported operations should all throw
    expect(() => fs.write?.("file1.txt", "content1")).toThrow();
    expect(() => fs.write?.("file2.txt", "content2")).toThrow();
    expect(() => fs.write?.("file3.txt", "content3")).toThrow();
  });
});

describe("edge cases", () => {
  it("should handle operations returning different function types", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Function Types Bridge",
        description: "A mock file system bridge to test different function types",
      },
      setup: () => ({
        read: async (path: string) => `content of ${path}`,
        write: () => Promise.resolve(),
        exists: () => { return Promise.resolve(true); },
        listdir: vi.fn().mockResolvedValue([]),
      }),
    });

    const fs = bridge();
    expect(fs.capabilities).toEqual({
      read: true,
      write: true,
      exists: true,
      listdir: true,
      mkdir: false,
      rm: false,
    });
  });

  it("should handle operations with different method signatures", async () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Method Signatures Bridge",
        description: "A mock file system bridge to test different method signatures",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        write: vi.fn().mockImplementation(() => {
          return Promise.resolve();
        }),
        listdir: vi.fn().mockImplementation(() => {
          return Promise.resolve([]);
        }),
        rm: vi.fn().mockImplementation(() => {
          return Promise.resolve();
        }),
      }),
    });

    const fs = bridge();
    assertCapability(fs, ["read", "write", "listdir", "rm"]);
    // should be able to call with various signatures
    await expect(fs.read("test.txt")).resolves.toBe("content");
    await expect(fs.write("test.txt", "data")).resolves.toBeUndefined();
    await expect(fs.write("test.txt", "data", "utf8")).resolves.toBeUndefined();
    await expect(fs.listdir("dir")).resolves.toEqual([]);
    await expect(fs.listdir("dir", true)).resolves.toEqual([]);
    await expect(fs.rm("file.txt")).resolves.toBeUndefined();
    await expect(fs.rm("file.txt", { force: true })).resolves.toBeUndefined();
  });

  it("should handle bridge state and operations interaction", async () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "State Interaction Bridge",
        description: "A mock file system bridge to test state and operations interaction",
      },
      state: { callCount: 0 },
      setup: ({ state }) => ({
        read: vi.fn().mockImplementation(() => {
          state.callCount++;
          return Promise.resolve(`content-${state.callCount}`);
        }),
        exists: vi.fn().mockResolvedValue(true),
      }),
    });

    const fs = bridge();

    expect(fs.capabilities.read).toBe(true);
    expect(fs.capabilities.exists).toBe(true);
    expect(fs.capabilities.write).toBe(false);
    assertCapability(fs, "read");

    await expect(fs.read("file1.txt")).resolves.toBe("content-1");
    await expect(fs.read("file2.txt")).resolves.toBe("content-2");
  });

  it("should maintain capability consistency across multiple bridge instances", () => {
    const bridgeFactory = defineFileSystemBridge({
      meta: {
        name: "Multiple Instances Bridge",
        description: "A mock file system bridge to test multiple instances",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        exists: vi.fn().mockResolvedValue(true),
      }),
    });

    const fs1 = bridgeFactory();
    const fs2 = bridgeFactory();

    expect(fs1.capabilities).toEqual(fs2.capabilities);
    expect(fs1.capabilities).toEqual({
      read: true,
      exists: true,
      write: false,
      listdir: false,
      mkdir: false,
      rm: false,
    });
  });
});

describe("type safety validation", () => {
  it("should allow calling methods after capability assertion", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Type Safety Bridge",
        description: "A mock file system bridge to test type safety",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        write: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const fs = bridge();

    // Assert capabilities
    assertCapability(fs, ["read", "write"]);

    // TypeScript should know these methods are defined
    expect(typeof fs.read).toBe("function");
    expect(typeof fs.write).toBe("function");
  });

  it("should work with single capability assertion", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Single Capability Bridge",
        description: "A mock file system bridge to test single capability assertion",
      },
      setup: () => ({
        exists: vi.fn().mockResolvedValue(true),
      }),
    });

    const fs = bridge();

    assertCapability(fs, "exists");
    expect(typeof fs.exists).toBe("function");
  });

  it("should work with different capability combinations", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Different Combinations Bridge",
        description: "A mock file system bridge to test different capability combinations",
      },
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        listdir: vi.fn().mockResolvedValue([]),
        mkdir: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const fs = bridge();

    assertCapability(fs, ["read", "listdir"]);
    expect(typeof fs.read).toBe("function");
    expect(typeof fs.listdir).toBe("function");

    assertCapability(fs, "mkdir");
    expect(typeof fs.mkdir).toBe("function");
  });
});
