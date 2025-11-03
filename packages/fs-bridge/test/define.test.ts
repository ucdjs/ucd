import { tryCatch } from "@ucdjs-internal/shared";
import { assert, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { defineFileSystemBridge } from "../src/define";
import { BridgeGenericError, BridgeSetupError } from "../src/errors";

describe("defineFileSystemBridge", () => {
  it("should create a working bridge instance", async () => {
    const bridge = defineFileSystemBridge({
      meta: { name: "Test Bridge", description: "A test bridge" },
      setup() {
        return {
          read: async (path) => `content of ${path}`,
          exists: async (path) => path === "exists.txt",
          listdir: async (_path) => [],
        };
      },
    })();

    expect(bridge).toBeDefined();
    expect(bridge.meta.name).toBe("Test Bridge");
    expect(bridge.meta.description).toBe("A test bridge");
    expect(bridge.read).toBeDefined();
    expect(bridge.exists).toBeDefined();
    expect(bridge.listdir).toBeDefined();
  });

  describe("setup error handling", () => {
    it("should throw BridgeSetupError when setup throws", () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Failing Bridge", description: "Setup throws" },
        setup() {
          throw new Error("Setup failed!");
        },
      });

      const [data, err] = tryCatch(() => bridge());

      if (data != null) expect.fail("The bridge setup should have failed");

      expect(err).toBeInstanceOf(BridgeSetupError);
      expect(err.message).toBe("Failed to setup file system bridge");
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

      if (data != null) expect.fail("The bridge setup should have failed");

      assert.instanceOf(err, BridgeSetupError);
      expect(err.originalError).toBe(originalError);
      expect(err.cause).toBe(originalError);
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
            read: async (_path) => "content",
            exists: async (_path) => true,
            listdir: async (_path) => [],
          };
        },
      });

      expect(() => bridge()).not.toThrow();
    });

    it("should pass validated options to setup", () => {
      const setupFn = vi.fn().mockReturnValue({
        read: async (_path: string) => "content",
        exists: async (_path: string) => true,
        listdir: async (_path: string) => [],
      });

      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        optionsSchema: z.object({
          apiKey: z.string(),
        }),
        setup: setupFn,
      });

      bridge({ apiKey: "secret-key" });

      expect(setupFn).toHaveBeenCalledWith(
        expect.objectContaining({
          options: { apiKey: "secret-key" },
        }),
      );
    });
  });

  describe("state handling", () => {
    it("should clone state for each bridge instance", async () => {
      const sharedState = {
        counter: 0,
      };

      const bridge = defineFileSystemBridge({
        meta: { name: "Stateful Bridge", description: "Bridge with state" },
        state: sharedState,
        setup({ state }) {
          state.counter++;
          return {
            read: async (_path) => `count: ${state.counter}`,
            exists: async (_path) => true,
            listdir: async (_path) => [],
          };
        },
      });

      const instance1 = bridge();
      const instance2 = bridge();

      await expect(instance1.read("test")).resolves.toBe("count: 1");
      await expect(instance2.read("test")).resolves.toBe("count: 1");

      // Original state should be unchanged
      expect(sharedState.counter).toBe(0);
    });

    it("should provide resolveSafePath to setup", () => {
      const setupFn = vi.fn().mockReturnValue({
        read: async (_path: string) => "content",
        exists: async (_path: string) => true,
        listdir: async (_path: string) => [],
      });

      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup: setupFn,
      });

      bridge();

      expect(setupFn).toHaveBeenCalledWith(
        expect.objectContaining({
          resolveSafePath: expect.any(Function),
        }),
      );
    });
  });

  describe("error handling", () => {
    it("should wrap non-Error throws in BridgeGenericError", async () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup() {
          return {
            read: async (_path) => {
              throw "string error"; // eslint-disable-line no-throw-literal
            },
            exists: async (_path) => true,
            listdir: async (_path) => [],
          };
        },
      })();

      await expect(bridge.read("test.txt")).rejects.toThrow(BridgeGenericError);
      await expect(bridge.read("test.txt")).rejects.toThrow(
        "Non-Error thrown in 'read' operation",
      );
    });

    it("should re-throw Error instances wrapped in BridgeGenericError", async () => {
      const originalError = new Error("Original error");
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup() {
          return {
            read: async (_path) => {
              throw originalError;
            },
            exists: async (_path) => true,
            listdir: async (_path) => [],
          };
        },
      })();

      await expect(bridge.read("test.txt")).rejects.toThrow(BridgeGenericError);
      await expect(bridge.read("test.txt")).rejects.toThrow("Unexpected error in 'read' operation");
    });
  });
});
