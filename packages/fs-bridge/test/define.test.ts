import type { FileSystemBridgeOperations } from "../src/types";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { assertCapability, BridgeGenericError, BridgeSetupError, BridgeUnsupportedOperation } from "../src";
import { defineFileSystemBridge } from "../src/define";

describe("defineFileSystemBridge", () => {
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
      setup: ({ options, state }) => {
        expect(options).toBeUndefined();
        expect(state).toEqual({});
        return mockOperations;
      },
    });

    const operations = bridge();

    assertCapability(operations, "read");
    await operations.read("test.txt");
    expect(mockOperations.read).toHaveBeenCalledWith("test.txt");
  });

  it("should infer options from Zod schema", async () => {
    const optionsSchema = z.object({
      basePath: z.string(),
      encoding: z.string().optional(),
    });

    const bridge = defineFileSystemBridge({
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
      setup: () => mockOperations,
    });

    const operations = bridge();
    assertCapability(operations, [
      "read",
      "write",
      "exists",
      "listdir",
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

  it("should work with state", async () => {
    const initialState = { callCount: 0 };

    const bridge = defineFileSystemBridge({
      state: initialState,
      setup: ({ state }) => {
        expect(state).toBe(initialState);

        return {
          read: vi.fn().mockImplementation(() => {
            state.callCount += 1;
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
    assertCapability(operations, ["read"]);

    const result1 = await operations.read("test1.txt");
    const result2 = await operations.read("test2.txt");

    expect(result1).toBe("content-1");
    expect(result2).toBe("content-2");
    expect(initialState.callCount).toBe(2);
  });

  describe("undefined options and state handling", () => {
    it("should handle bridge with optionsSchema but no options passed", () => {
      const optionsSchema = z.object({
        optional: z.string().optional(),
      });

      const bridge = defineFileSystemBridge({
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
      assertCapability(operations, ["read"]);

      await expect(operations.read("test")).resolves.toBe("content");
    });
  });

  it("should throw when accessing unsupported operation", () => {
    const bridge = defineFileSystemBridge({
      setup: () => ({}),
    });

    const operations = bridge();

    expect(() => operations.read!("undefined")).toThrowError(new BridgeUnsupportedOperation("read"));
  });

  it("should throw if method doesn't have catch", () => {
    const p = Promise.resolve("value");

    const bridge = defineFileSystemBridge({
      setup: () => ({
        read: vi.fn().mockImplementation(() => {
          return { then: p.then.bind(p) };
        }),
      }),
    });

    const operations = bridge();

    expect(() => operations.read!("undefined")).toThrowError(new BridgeGenericError("The promise returned by 'read' operation does not support .catch()"));
  });

  describe("error handling", () => {
    it("should throw if an error occurs in the setup function", () => {
      const bridge = defineFileSystemBridge({
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
        setup: () => ({
          read: vi.fn().mockRejectedValue(new Error("Async error")),
        }),
      });

      const operations = bridge();

      await expect(operations.read!("undefined")).rejects.toThrow(
        "Unexpected error in 'read' operation: Async error",
      );
    });

    it("should catch and rethrow errors from sync operations", () => {
      const bridge = defineFileSystemBridge({
        setup: () => ({
          read: vi.fn().mockImplementation(() => {
            throw new Error("Sync error");
          }),
        }),
      });

      const operations = bridge();

      expect(() => operations.read!("undefined")).toThrow(
        "Unexpected error in 'read' operation: Sync error",
      );
    });
  });
});
