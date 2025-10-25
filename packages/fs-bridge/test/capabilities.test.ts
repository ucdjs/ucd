import type { FileSystemBridgeOperations, HasOptionalCapabilityMap } from "../src/types";
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
        listdir: vi.fn().mockResolvedValue([]),
        // write, mkdir, rm not returned
      }),
    });

    const fs = bridge();
    expect(fs.optionalCapabilities).toEqual({
      write: false,
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
    expect(fs.optionalCapabilities).toEqual({
      write: true,
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
      // @ts-expect-error We haven't implemented the required operations
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        write: vi.fn().mockResolvedValue(undefined),
        // only read and write capabilities
      }),
    });

    const fs = bridge();
    expect(fs.optionalCapabilities).toEqual({
      write: true,
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
      // @ts-expect-error We haven't implemented the required operations
      setup: () => ({}), // no operations
    });

    const fs = bridge();
    expect(fs.optionalCapabilities).toEqual({
      write: false,
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
      // @ts-expect-error We haven't implemented the required operations
      setup: () => ({
        read: undefined as any,
        write: null as any,
        exists: vi.fn().mockResolvedValue(true),
      }),
    });

    const fs = bridge();
    expect(fs.optionalCapabilities).toEqual({
      write: false,
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
    expect(fs.optionalCapabilities).toEqual({
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
      // @ts-expect-error We haven't implemented the required operations
      setup: () => ({
        write: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        // no read, listdir, rm operations
      }),
    });

    const fs = bridge();
    expect(fs.optionalCapabilities).toEqual({
      write: true,
      mkdir: true,
      rm: false,
    });
  });
});

describe("assertCapability function", () => {
  const createMockBridge = (capabilities: Partial<HasOptionalCapabilityMap>) => {
    const operations: FileSystemBridgeOperations = {
      read: vi.fn().mockResolvedValue("content"),
      exists: vi.fn().mockResolvedValue(true),
      listdir: vi.fn().mockResolvedValue([]),
    };

    // Add mock operations based on capabilities
    if (capabilities.write) operations.write = vi.fn().mockResolvedValue(undefined);
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
    const bridge = createMockBridge({ write: true });
    expect(() => assertCapability(bridge, "write")).not.toThrow();
  });

  it("should throw when single capability is missing", () => {
    const bridge = createMockBridge({ write: false });
    expect(() => assertCapability(bridge, "write")).toThrow(BridgeUnsupportedOperation);
  });

  it("should pass when all capabilities in array are available", () => {
    const bridge = createMockBridge({ write: true, mkdir: true, rm: true });
    expect(() => assertCapability(bridge, ["write", "mkdir", "rm"])).not.toThrow();
  });

  it("should throw when any capability in array is missing", () => {
    const bridge = createMockBridge({ write: false, mkdir: true });
    expect(() => assertCapability(bridge, ["mkdir", "write"])).toThrow(BridgeUnsupportedOperation);
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
    const bridge = createMockBridge({ write: false, mkdir: true, rm: false });

    try {
      assertCapability(bridge, ["mkdir", "write", "rm"]);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(BridgeUnsupportedOperation);
      expect((error as BridgeUnsupportedOperation).capability).toBe("write");
    }
  });

  it("should work with all capability types", () => {
    const bridge = createMockBridge({
      write: true,
      mkdir: true,
      rm: true,
    });

    expect(() => assertCapability(bridge, "write")).not.toThrow();
    expect(() => assertCapability(bridge, "mkdir")).not.toThrow();
    expect(() => assertCapability(bridge, "rm")).not.toThrow();
  });

  it("should handle empty capability array", () => {
    const bridge = createMockBridge({ write: true });
    expect(() => assertCapability(bridge, [])).not.toThrow();
  });
});

describe("proxy error handling", () => {
  it("should throw descriptive error for unsupported write operation", async () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Write Error Bridge",
        description: "A mock file system bridge that throws in write operation",
      },
      // @ts-expect-error We haven't implemented all required operations
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        // no write operation
      }),
    });

    const fs = bridge();
    await expect(() => fs.write?.("test.txt", "content")).rejects.toThrow(
      "File system bridge does not support the 'write' capability.",
    );
  });

  it("should throw descriptive error for unsupported mkdir operation", async () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Mkdir Error Bridge",
        description: "A mock file system bridge that throws in mkdir operation",
      },
      // @ts-expect-error We haven't implemented all required operations
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        // no mkdir operation
      }),
    });

    const fs = bridge();

    await expect(() => fs.mkdir?.("new-dir")).rejects.toThrow(
      "File system bridge does not support the 'mkdir' capability.",
    );
  });

  it("should throw descriptive error for unsupported rm operation", async () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "RM Error Bridge",
        description: "A mock file system bridge that throws in rm operation",
      },
      // @ts-expect-error We haven't implemented all required operations
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        // no rm operation
      }),
    });

    const fs = bridge();
    await expect(() => fs.rm?.("test.txt")).rejects.toThrow(
      "File system bridge does not support the 'rm' capability.",
    );
  });

  it("should allow supported operations to work normally", async () => {
    const mockRead = vi.fn().mockResolvedValue("test content");
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Read Operation Bridge",
        description: "A mock file system bridge with read operation",
      },
      // @ts-expect-error We haven't implemented all required operations
      setup: () => ({
        read: mockRead,
      }),
    });

    const fs = bridge();
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
      // @ts-expect-error We haven't implemented all required operations
      setup: () => ({
        read: mockRead,
        exists: mockExists,
        // no write, listdir, mkdir, rm
      }),
    });

    const fs = bridge();

    // supported operations should work
    await expect(fs.read("test.txt")).resolves.toBe("content");
    await expect(fs.exists("test.txt")).resolves.toBe(true);

    // unsupported operations should throw
    await expect(() => fs.write?.("test.txt", "content")).rejects.toThrow();
    await expect(() => fs.mkdir?.("dir")).rejects.toThrow();
    await expect(() => fs.rm?.("test.txt")).rejects.toThrow();
  });

  it("should not interfere with capabilities property access", () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Capabilities Access Bridge",
        description: "A mock file system bridge to test capabilities access",
      },
      // @ts-expect-error We haven't implemented all required operations
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
      }),
    });

    const fs = bridge();

    expect(fs.optionalCapabilities).toEqual({
      write: false,
      mkdir: false,
      rm: false,
    });
  });

  it("should handle concurrent unsupported operation calls", async () => {
    const bridge = defineFileSystemBridge({
      meta: {
        name: "Concurrent Unsupported Bridge",
        description: "A mock file system bridge to test concurrent unsupported operations",
      },
      // @ts-expect-error We haven't implemented all required operations
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        // no write operation
      }),
    });

    const fs = bridge();
    // multiple calls to unsupported operations should all throw
    await expect(() => fs.write?.("file1.txt", "content1")).rejects.toThrow();
    await expect(() => fs.write?.("file2.txt", "content2")).rejects.toThrow();
    await expect(() => fs.write?.("file3.txt", "content3")).rejects.toThrow();
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
    expect(fs.optionalCapabilities).toEqual({
      write: true,
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
      // @ts-expect-error We haven't implemented all required operations
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

    await expect(fs.read("test.txt")).resolves.toBe("content");
    await expect(fs.listdir("dir")).resolves.toEqual([]);
    await expect(fs.listdir("dir", true)).resolves.toEqual([]);

    assertCapability(fs, ["write", "rm"]);
    // should be able to call with various signatures
    await expect(fs.write("test.txt", "data")).resolves.toBeUndefined();
    await expect(fs.write("test.txt", "data", "utf8")).resolves.toBeUndefined();
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
      // @ts-expect-error We haven't implemented all required operations
      setup: ({ state }) => ({
        read: vi.fn().mockImplementation(() => {
          state.callCount++;
          return Promise.resolve(`content-${state.callCount}`);
        }),
        exists: vi.fn().mockResolvedValue(true),
      }),
    });

    const fs = bridge();

    expect(fs.optionalCapabilities.write).toBe(false);

    await expect(fs.read("file1.txt")).resolves.toBe("content-1");
    await expect(fs.read("file2.txt")).resolves.toBe("content-2");
  });

  it("should maintain capability consistency across multiple bridge instances", () => {
    const bridgeFactory = defineFileSystemBridge({
      meta: {
        name: "Multiple Instances Bridge",
        description: "A mock file system bridge to test multiple instances",
      },
      // @ts-expect-error We haven't implemented all required operations
      setup: () => ({
        read: vi.fn().mockResolvedValue("content"),
        exists: vi.fn().mockResolvedValue(true),
      }),
    });

    const fs1 = bridgeFactory();
    const fs2 = bridgeFactory();

    expect(fs1.optionalCapabilities).toEqual(fs2.optionalCapabilities);
    expect(fs1.optionalCapabilities).toEqual({
      write: false,
      mkdir: false,
      rm: false,
    });
  });
});
