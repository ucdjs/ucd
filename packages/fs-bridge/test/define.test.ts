import type { FileSystemBridgeOperations } from "../src/types";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  assertCapability,
  BridgeGenericError,
  BridgeSetupError,
  BridgeUnsupportedOperation,
} from "../src";
import { defineFileSystemBridge } from "../src/define";

describe("defineFileSystemBridge", () => {
  describe("basic bridge creation", () => {
    it("should create a filesystem bridge with no options", async () => {
      const mockOperations: FileSystemBridgeOperations = {
        read: vi.fn().mockResolvedValue("file content"),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue(["file1.txt", "file2.txt"]),
        mkdir: vi.fn().mockResolvedValue(undefined),
        rm: vi.fn().mockResolvedValue(undefined),
      };

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Mock Bridge",
          description: "A mock file system bridge for testing",
        },
        setup: ({ options, state }) => {
          expect(options).toBeUndefined();
          expect(state).toEqual({});
          return mockOperations;
        },
      });

      const operations = bridge();

      await operations.read("test.txt");
      expect(mockOperations.read).toHaveBeenCalledWith("test.txt");
    });

    it("should allow all filesystem operations to be called", async () => {
      const mockOperations = {
        read: vi.fn().mockResolvedValue("file content"),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue(["file1.txt"]),
        mkdir: vi.fn().mockResolvedValue(undefined),
        rm: vi.fn().mockResolvedValue(undefined),
      };

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Full Mock Bridge",
          description: "A mock file system bridge supporting all operations",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();

      assertCapability(operations, [
        "write",
        "mkdir",
        "rm",
      ]);

      await operations.read("test.txt");
      await operations.write("test.txt", "content");
      await operations.exists("test.txt");
      await operations.listdir("/", true);
      await operations.mkdir("newdir");
      await operations.rm("oldfile", { recursive: true, force: false });

      expect(mockOperations.read).toHaveBeenCalledWith("test.txt");
      expect(mockOperations.write).toHaveBeenCalledWith("test.txt", "content");
      expect(mockOperations.exists).toHaveBeenCalledWith("test.txt");
      expect(mockOperations.listdir).toHaveBeenCalledWith("/", true);
      expect(mockOperations.mkdir).toHaveBeenCalledWith("newdir");
      expect(mockOperations.rm).toHaveBeenCalledWith("oldfile", { recursive: true, force: false });
    });
  });

  describe("options and configuration", () => {
    it("should infer options from Zod schema", async () => {
      const optionsSchema = z.object({
        basePath: z.string(),
        encoding: z.string().optional(),
      });

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Configurable Mock Bridge",
          description: "A mock file system bridge with configurable options",
        },
        optionsSchema,
        setup: ({ options }) => {
          expect(options.basePath).toBe("/test/path");
          expect(options.encoding).toBe("utf-8");

          return {
            read: vi.fn().mockResolvedValue("content"),
            write: vi.fn().mockResolvedValue(undefined),
            exists: vi.fn().mockResolvedValue(true),
            listdir: vi.fn().mockResolvedValue([]),
            mkdir: vi.fn().mockResolvedValue(undefined),
            rm: vi.fn().mockResolvedValue(undefined),
          };
        },
      });

      const operations = bridge({
        basePath: "/test/path",
        encoding: "utf-8",
      });

      expect(operations).toBeDefined();
    });

    it("should validate options and throw on invalid input", () => {
      const optionsSchema = z.object({
        requiredField: z.string(),
      });

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Invalid Options Bridge",
          description: "A mock file system bridge to test invalid options",
        },
        optionsSchema,
        setup: () => ({
          read: vi.fn().mockResolvedValue(""),
          write: vi.fn().mockResolvedValue(undefined),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
          mkdir: vi.fn().mockResolvedValue(undefined),
          rm: vi.fn().mockResolvedValue(undefined),
        }),
      });

      expect(() => {
        // @ts-expect-error - intentionally passing invalid options
        bridge({ invalidField: "value" });
      }).toThrow("Invalid options provided to file system bridge");
    });
  });

  describe("state management", () => {
    it("should work with state", async () => {
      let callCount = 0;

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Stateful Mock Bridge",
          description: "A mock file system bridge that maintains state",
        },
        state: { callCount },
        setup: ({ state }) => {
          expect(state.callCount).toEqual(callCount);

          return {
            read: vi.fn().mockImplementation(() => {
              // The state.callCount will not update the outer `callCount` variable,
              // since we want to prevent side-effects with state, when multiple of the same bridges
              // are created and used.
              state.callCount += 1;
              callCount += 1;
              return Promise.resolve(`content-${state.callCount}`);
            }),
            write: vi.fn().mockResolvedValue(undefined),
            exists: vi.fn().mockResolvedValue(true),
            listdir: vi.fn().mockResolvedValue([]),
            mkdir: vi.fn().mockResolvedValue(undefined),
            rm: vi.fn().mockResolvedValue(undefined),
          };
        },
      });

      const operations = bridge();

      const result1 = await operations.read("test1.txt");
      const result2 = await operations.read("test2.txt");

      expect(result1).toBe("content-1");
      expect(result2).toBe("content-2");
      expect(callCount).toBe(2);
    });

    it("should handle bridge with optionsSchema but no options passed", () => {
      const optionsSchema = z.object({
        optional: z.string().optional(),
      });

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Optional Options Bridge",
          description: "A mock file system bridge with optional options",
        },
        optionsSchema,
        setup: ({ options, state }) => {
          // options should be an empty object when no arguments passed
          expect(options).toEqual({});
          expect(state).toEqual({});

          return {
            read: vi.fn().mockResolvedValue("content"),
            write: vi.fn().mockResolvedValue(undefined),
            exists: vi.fn().mockResolvedValue(true),
            listdir: vi.fn().mockResolvedValue([]),
            mkdir: vi.fn().mockResolvedValue(undefined),
            rm: vi.fn().mockResolvedValue(undefined),
          };
        },
      });

      const operations = bridge({});
      expect(operations).toBeDefined();
    });

    it("should fail when required options are missing", () => {
      const optionsSchema = z.object({
        required: z.string(),
      });

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Required Options Bridge",
          description: "A mock file system bridge with required options",
        },
        optionsSchema,
        setup: () => ({
          read: vi.fn().mockResolvedValue(""),
          write: vi.fn().mockResolvedValue(undefined),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
          mkdir: vi.fn().mockResolvedValue(undefined),
          rm: vi.fn().mockResolvedValue(undefined),
        }),
      });

      expect(() => {
        // @ts-expect-error - passing no options when required field exists
        bridge({});
      }).toThrow("Invalid options provided to file system bridge");
    });

    it("should handle accessing state properties when state is undefined", async () => {
      const bridge = defineFileSystemBridge({
        meta: {
          name: "State Access Bridge",
          description: "A mock file system bridge to test state access",
        },
        setup: ({ state }) => {
          // state should be an empty object, not undefined
          expect(state).toEqual({});
          expect(state.someProperty).toBeUndefined();

          return {
            read: vi.fn().mockImplementation(() => {
              // this should not throw even though someProperty doesn't exist
              state.someProperty = "test";
              return Promise.resolve("content");
            }),
            write: vi.fn().mockResolvedValue(undefined),
            exists: vi.fn().mockResolvedValue(true),
            listdir: vi.fn().mockResolvedValue([]),
            mkdir: vi.fn().mockResolvedValue(undefined),
            rm: vi.fn().mockResolvedValue(undefined),
          };
        },
      });

      const operations = bridge();

      await expect(operations.read("test")).resolves.toBe("content");
    });
  });

  describe("unsupported operations", () => {
    it("should throw when accessing unsupported operation", () => {
      const bridge = defineFileSystemBridge({
        name: "Unsupported Operation Bridge",
        description: "A mock file system bridge with no operations",
        // @ts-expect-error We don't implement the required operations.
        setup: () => {
          return {};
        },
      });

      const operations = bridge();

      expect(() => operations.write!("./test.txt", "Hello!")).toThrowError(new BridgeUnsupportedOperation("write"));
    });

    it("should throw if method doesn't have catch", () => {
      const p = Promise.resolve("value");

      const bridge = defineFileSystemBridge({
        name: "No Catch Bridge",
        description: "A mock file system bridge to test promise without catch",
        // @ts-expect-error We don't implement the required operations
        setup: () => {
          return {
            write: vi.fn().mockImplementation(() => {
              return { then: p.then.bind(p) };
            }),
          };
        },
      });

      const operations = bridge();

      expect(() => operations.write!("./test.txt", "hello!")).toThrowError(
        new BridgeGenericError("The promise returned by 'write' operation does not support .catch()"),
      );
    });
  });

  describe("error handling", () => {
    it("should throw if an error occurs in the setup function", () => {
      const bridge = defineFileSystemBridge({
        meta: {
          name: "Setup Error Bridge",
          description: "A mock file system bridge that throws in setup",
        },
        setup: () => {
          throw new Error("Setup error");
        },
      });

      let error: BridgeSetupError | null = null;

      try {
        bridge();

        expect.fail("Expected BridgeSetupError to be thrown");
      } catch (err: any) {
        error = err;
      }

      expect(error).toBeInstanceOf(BridgeSetupError);
      expect(error?.message).toBe("Failed to setup file system bridge");
      expect(error?.originalError).toBeInstanceOf(Error);
      expect(error?.originalError?.message).toBe("Setup error");
    });

    it("should catch and rethrow errors from async operations", async () => {
      const bridge = defineFileSystemBridge({
        name: "Async Error Bridge",
        description: "A mock file system bridge that throws in async operation",
        // @ts-expect-error We don't implement the required operations
        setup: () => {
          return {
            write: vi.fn().mockRejectedValue(new Error("Async error")),
          };
        },
      });

      const operations = bridge();

      await expect(operations.write!("./test.txt", "Hello!")).rejects.toThrow(
        "Unexpected error in 'write' operation: Async error",
      );
    });

    it("should catch and rethrow errors from sync operations", () => {
      const bridge = defineFileSystemBridge({
        name: "Sync Error Bridge",
        description: "A mock file system bridge that throws in sync operation",
        // @ts-expect-error We don't implement the required operations
        setup: () => {
          return {
            write: vi.fn().mockImplementation(() => {
              throw new Error("Sync error");
            }),
          };
        },
      });

      const operations = bridge();

      expect(() => operations.write!("./test.txt", "hELLO!")).toThrow(
        "Unexpected error in 'write' operation: Sync error",
      );
    });
  });
});
