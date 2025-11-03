import { describe, expect, it, vi } from "vitest";
import { BridgeUnsupportedOperation } from "../src";
import { defineFileSystemBridge } from "../src/define";

describe("hooks", () => {
  describe("before hooks", () => {
    it("should call before hook with correct payload", async () => {
      const beforeHook = vi.fn();
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup: () => ({
          read: vi.fn().mockResolvedValue("content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const fs = bridge();
      fs.hook("read:before", beforeHook);

      await fs.read("test.txt");

      expect(beforeHook).toHaveBeenCalledOnce();
      expect(beforeHook).toHaveBeenCalledWith({ path: "test.txt" });
    });

    it("should call before hook for multiple operations", async () => {
      const beforeHook = vi.fn();
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup: () => ({
          read: vi.fn().mockResolvedValue("content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const fs = bridge();
      fs.hook("read:before", beforeHook);

      await fs.read("file1.txt");
      await fs.read("file2.txt");

      expect(beforeHook).toHaveBeenCalledTimes(2);
      expect(beforeHook).toHaveBeenNthCalledWith(1, { path: "file1.txt" });
      expect(beforeHook).toHaveBeenNthCalledWith(2, { path: "file2.txt" });
    });

    it("should call before hook with operation-specific payload", async () => {
      const listdirBeforeHook = vi.fn();
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup: () => ({
          read: vi.fn().mockResolvedValue("content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const fs = bridge();
      fs.hook("listdir:before", listdirBeforeHook);

      await fs.listdir("/path", true);

      expect(listdirBeforeHook).toHaveBeenCalledWith({
        path: "/path",
        recursive: true,
      });
    });
  });

  describe("after hooks", () => {
    it("should call after hook with result", async () => {
      const afterHook = vi.fn();
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup: () => ({
          read: vi.fn().mockResolvedValue("file content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const fs = bridge();
      fs.hook("read:after", afterHook);

      await fs.read("test.txt");

      expect(afterHook).toHaveBeenCalledWith({
        path: "test.txt",
        content: "file content",
      });
    });

    it("should not call after hook if operation fails", async () => {
      const afterHook = vi.fn();
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup: () => ({
          read: vi.fn().mockRejectedValue(new Error("Read failed")),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const fs = bridge();
      fs.hook("read:after", afterHook);

      await expect(fs.read("test.txt")).rejects.toThrow();
      expect(afterHook).not.toHaveBeenCalled();
    });
  });

  describe("error hooks", () => {
    it("should call error hook on operation failure", async () => {
      const errorHook = vi.fn();
      const testError = new Error("Read error");
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup: () => ({
          read: vi.fn().mockRejectedValue(testError),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const fs = bridge();
      fs.hook("error", errorHook);

      await expect(fs.read("test.txt")).rejects.toThrow();

      expect(errorHook).toHaveBeenCalledOnce();
      expect(errorHook).toHaveBeenCalledWith({
        method: "read",
        path: "test.txt",
        error: testError,
        args: ["test.txt"],
      });
    });

    it("should call error hook for unsupported operations", async () => {
      const errorHook = vi.fn();
      const bridge = defineFileSystemBridge({
        meta: { name: "Read-Only", description: "Read-only" },
        setup: () => ({
          read: vi.fn().mockResolvedValue("content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const fs = bridge();
      fs.hook("error", errorHook);

      await expect(fs.write?.("test.txt", "content")).rejects.toThrow(
        BridgeUnsupportedOperation,
      );

      expect(errorHook).toHaveBeenCalledWith({
        method: "write",
        path: "test.txt",
        error: expect.any(BridgeUnsupportedOperation),
        args: ["test.txt", "content"],
      });
    });
  });

  describe("hook execution order and behavior", () => {
    it("should call hooks in correct order: before → operation → after", async () => {
      const callOrder: string[] = [];
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup: () => ({
          read: vi.fn().mockImplementation(async () => {
            callOrder.push("operation");
            return "content";
          }),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const fs = bridge();
      fs.hook("read:before", () => callOrder.push("before"));
      fs.hook("read:after", () => callOrder.push("after"));

      await fs.read("test.txt");

      expect(callOrder).toEqual(["before", "operation", "after"]);
    });

    it("should support multiple handlers for same hook", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup: () => ({
          read: vi.fn().mockResolvedValue("content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const fs = bridge();
      fs.hook("read:before", handler1);
      fs.hook("read:before", handler2);
      fs.hook("read:before", handler3);

      await fs.read("test.txt");

      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
      expect(handler3).toHaveBeenCalledOnce();
    });

    it("should not interfere with operation return values", async () => {
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup: () => ({
          read: vi.fn().mockResolvedValue("file content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([
            { type: "file" as const, name: "test.txt", path: "test.txt" },
          ]),
        }),
      });

      const fs = bridge();
      fs.hook("read:before", vi.fn());
      fs.hook("read:after", vi.fn());
      fs.hook("exists:before", vi.fn());
      fs.hook("exists:after", vi.fn());

      const readResult = await fs.read("test.txt");
      const existsResult = await fs.exists("test.txt");

      expect(readResult).toBe("file content");
      expect(existsResult).toBe(true);
    });
  });
});
