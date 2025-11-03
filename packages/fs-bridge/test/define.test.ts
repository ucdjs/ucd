import { tryCatch } from "@ucdjs-internal/shared";
import { assert, describe, expect, it } from "vitest";
import { z } from "zod";
import { defineFileSystemBridge } from "../src/define";
import { BridgeSetupError, BridgeUnsupportedOperation } from "../src/errors";

describe("defineFileSystemBridge", () => {
  describe("async/sync mode detection", () => {
    it("should detect sync mode when all required operations are sync", () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Sync Bridge", description: "All sync operations" },
        setup() {
          return {
            read: (_path) => "content",
            exists: (_path) => true,
            listdir: (_path) => [],
          };
        },
      })();

      expect(bridge.meta.isAsyncMode).toBe(false);

      // Unsupported operations should throw synchronously in sync mode
      expect(() => bridge.write?.("file.txt", "data")).toThrow(BridgeUnsupportedOperation);
      expect(() => bridge.mkdir?.("dir")).toThrow(BridgeUnsupportedOperation);
      expect(() => bridge.rm?.("file.txt")).toThrow(BridgeUnsupportedOperation);
    });

    it("should detect async mode when all required operations are async", async () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Async Bridge", description: "All async operations" },
        setup() {
          return {
            read: async (_path) => "content",
            exists: async (_path) => true,
            listdir: async (_path) => [],
          };
        },
      })();

      expect(bridge.meta.isAsyncMode).toBe(true);

      // Unsupported operations should return rejected Promise in async mode
      await expect(bridge.write?.("file.txt", "data")).rejects.toThrow(BridgeUnsupportedOperation);
      await expect(bridge.mkdir?.("dir")).rejects.toThrow(BridgeUnsupportedOperation);
      await expect(bridge.rm?.("file.txt")).rejects.toThrow(BridgeUnsupportedOperation);
    });

    it("should detect async mode when ANY required operation is async", async () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Mixed Bridge", description: "Mixed async/sync operations" },
        setup() {
          return {
            read: async (_path) => "content", // Only this is async
            exists: (_path) => true, // Sync
            listdir: (_path) => [], // Sync
          };
        },
      })();

      expect(bridge.meta.isAsyncMode).toBe(true);

      // Should be async mode because read is async
      await expect(bridge.write?.("file.txt", "data")).rejects.toThrow(BridgeUnsupportedOperation);
    });

    it("should detect async mode when exists is the only async operation", async () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Async Exists Bridge", description: "Only exists is async" },
        setup() {
          return {
            read: (_path) => "content", // Sync
            exists: async (_path) => true, // Only this is async
            listdir: (_path) => [], // Sync
          };
        },
      })();

      expect(bridge.meta.isAsyncMode).toBe(true);
      await expect(bridge.write?.("file.txt", "data")).rejects.toThrow(BridgeUnsupportedOperation);
    });

    it("should detect async mode when listdir is the only async operation", async () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Async Listdir Bridge", description: "Only listdir is async" },
        setup() {
          return {
            read: (_path) => "content", // Sync
            exists: (_path) => true, // Sync
            listdir: async (_path) => [], // Only this is async
          };
        },
      })();

      expect(bridge.meta.isAsyncMode).toBe(true);
      await expect(bridge.write?.("file.txt", "data")).rejects.toThrow(BridgeUnsupportedOperation);
    });

    it("should preserve original meta properties along with isAsyncMode", () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Test Bridge", description: "Test description" },
        setup() {
          return {
            read: (_path) => "content",
            exists: (_path) => true,
            listdir: (_path) => [],
          };
        },
      })();

      expect(bridge.meta.name).toBe("Test Bridge");
      expect(bridge.meta.description).toBe("Test description");
      expect(bridge.meta.isAsyncMode).toBe(false);
    });
  });

  describe("setup error handling", () => {
    it("should throw BridgeSetupError when setup throws", () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Failing Bridge", description: "Setup throws" },
        setup() {
          throw new Error("Setup failed!");
        },
      });

      expect(() => bridge()).toThrow(BridgeSetupError);
      expect(() => bridge()).toThrow("Failed to setup file system bridge");
    });

    it("should wrap original error in BridgeSetupError", () => {
      const originalError = new Error("Connection timeout");

      const bridge = defineFileSystemBridge({
        meta: { name: "Failing Bridge", description: "Setup throws" },
        setup() {
          throw originalError;
        },
      });

      const [data, err] = tryCatch(() => bridge());

      if (data != null) {
        expect.fail("The bridge setup should have failed");
      }

      assert.instanceOf(err, BridgeSetupError);
      expect(err!.originalError).toBe(originalError);
      expect(err!.cause).toBe(originalError);
    });
  });

  describe("options validation", () => {
    it("should validate options with schema", () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Bridge with Options", description: "Has options schema" },
        optionsSchema: z.object({
          baseUrl: z.url(),
        }),
        setup({ options }) {
          return {
            read: async (_path) => `Reading from ${options.baseUrl}`,
            exists: async (_path) => true,
            listdir: async (_path) => [],
          };
        },
      });

      expect(() => bridge({ baseUrl: "https://example.com" })).not.toThrow();

      expect(() => bridge({ baseUrl: "not-a-url" })).toThrow("Invalid options");
    });

    it("should work without options schema", () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "No Options Bridge", description: "No schema" },
        setup() {
          return {
            read: (_path) => "content",
            exists: (_path) => true,
            listdir: (_path) => [],
          };
        },
      });

      expect(() => bridge()).not.toThrow();
    });
  });

  describe("operation execution", () => {
    it("should execute sync operations without async overhead", () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Sync Bridge", description: "Sync operations" },
        setup() {
          return {
            read: (path) => `content of ${path}`,
            exists: (path) => path === "exists.txt",
            listdir: (_path) => [{ type: "file", name: "file.txt", path: "file.txt" }],
          };
        },
      })();

      const readResult = bridge.read("test.txt");
      expect(readResult).not.toBeInstanceOf(Promise);
      expect(readResult).toBe("content of test.txt");

      const existsResult = bridge.exists("exists.txt");
      expect(existsResult).not.toBeInstanceOf(Promise);
      expect(existsResult).toBe(true);

      const listResult = bridge.listdir("/");
      expect(listResult).not.toBeInstanceOf(Promise);
      expect(Array.isArray(listResult)).toBe(true);
    });

    it("should execute async operations and return Promises", async () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Async Bridge", description: "Async operations" },
        setup() {
          return {
            read: async (path) => `content of ${path}`,
            exists: async (path) => path === "exists.txt",
            listdir: async (_path) => [{ type: "file", name: "file.txt", path: "file.txt" }],
          };
        },
      })();

      const readResult = bridge.read("test.txt");
      expect(readResult).toBeInstanceOf(Promise);
      await expect(readResult).resolves.toBe("content of test.txt");

      const existsResult = bridge.exists("exists.txt");
      expect(existsResult).toBeInstanceOf(Promise);
      await expect(existsResult).resolves.toBe(true);

      const listResult = bridge.listdir("/");
      expect(listResult).toBeInstanceOf(Promise);
      await expect(listResult).resolves.toHaveLength(1);
    });
  });
});
