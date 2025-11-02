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

    it("should work with both sync and async operations", () => {
      const syncBeforeHook = vi.fn();
      const asyncBeforeHook = vi.fn();

      const syncBridge = defineFileSystemBridge({
        meta: { name: "Sync", description: "Sync" },
        setup: () => ({
          read: vi.fn().mockReturnValue("sync content"),
          exists: vi.fn().mockReturnValue(true),
          listdir: vi.fn().mockReturnValue([]),
        }),
      });

      const asyncBridge = defineFileSystemBridge({
        meta: { name: "Async", description: "Async" },
        setup: () => ({
          read: vi.fn().mockResolvedValue("async content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const syncFs = syncBridge();
      const asyncFs = asyncBridge();

      syncFs.hook("read:before", syncBeforeHook);
      asyncFs.hook("read:before", asyncBeforeHook);

      // Both should call before hooks
      syncFs.read("sync.txt");
      asyncFs.read("async.txt");

      expect(syncBeforeHook).toHaveBeenCalledWith({ path: "sync.txt" });
      expect(asyncBeforeHook).toHaveBeenCalledWith({ path: "async.txt" });
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

    it("should work with both sync and async operations", async () => {
      const syncAfterHook = vi.fn();
      const asyncAfterHook = vi.fn();

      const syncBridge = defineFileSystemBridge({
        meta: { name: "Sync", description: "Sync" },
        setup: () => ({
          read: vi.fn().mockReturnValue("sync content"),
          exists: vi.fn().mockReturnValue(true),
          listdir: vi.fn().mockReturnValue([]),
        }),
      });

      const asyncBridge = defineFileSystemBridge({
        meta: { name: "Async", description: "Async" },
        setup: () => ({
          read: vi.fn().mockResolvedValue("async content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const syncFs = syncBridge();
      const asyncFs = asyncBridge();

      syncFs.hook("read:after", syncAfterHook);
      asyncFs.hook("read:after", asyncAfterHook);

      // Sync operation
      const syncResult = syncFs.read("sync.txt");
      expect(syncResult).toBe("sync content");
      expect(syncAfterHook).toHaveBeenCalledWith({
        path: "sync.txt",
        content: "sync content",
      });

      // Async operation
      const asyncResult = await asyncFs.read("async.txt");
      expect(asyncResult).toBe("async content");
      expect(asyncAfterHook).toHaveBeenCalledWith({
        path: "async.txt",
        content: "async content",
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
    it("should call error hook on async operation failure", async () => {
      const errorHook = vi.fn();
      const testError = new Error("Async read error");
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

    it("should call error hook on sync operation failure", () => {
      const errorHook = vi.fn();
      const testError = new Error("Sync read error");
      const bridge = defineFileSystemBridge({
        meta: { name: "Test", description: "Test" },
        setup: () => ({
          read: vi.fn().mockImplementation(() => {
            throw testError;
          }),
          exists: vi.fn().mockReturnValue(true),
          listdir: vi.fn().mockReturnValue([]),
        }),
      });

      const fs = bridge();
      fs.hook("error", errorHook);

      expect(() => fs.read("test.txt")).toThrow();

      expect(errorHook).toHaveBeenCalledOnce();
      expect(errorHook).toHaveBeenCalledWith({
        method: "read",
        path: "test.txt",
        error: testError,
        args: ["test.txt"],
      });
    });

    it("should call error hook for unsupported operations", () => {
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

      expect(() => fs.write?.("test.txt", "content")).toThrow(
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
