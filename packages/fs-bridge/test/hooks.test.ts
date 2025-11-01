import type { FileSystemBridgeOperations } from "../src/types";
import { describe, expect, it, vi } from "vitest";
import { assertCapability, BridgeUnsupportedOperation } from "../src";
import { defineFileSystemBridge } from "../src/define";

describe("hooks", () => {
  describe("before hooks", () => {
    it("should call read:before hook with path", async () => {
      const beforeHook = vi.fn();
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
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("read:before", beforeHook);

      await operations.read("test.txt");

      expect(beforeHook).toHaveBeenCalledOnce();
      expect(beforeHook).toHaveBeenCalledWith({ path: "test.txt" });
    });

    it("should call write:before hook with path and content", async () => {
      const beforeHook = vi.fn();
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
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("write:before", beforeHook);

      assertCapability(operations, "write");
      await operations.write("test.txt", "hello world");

      expect(beforeHook).toHaveBeenCalledOnce();
      expect(beforeHook).toHaveBeenCalledWith({
        path: "test.txt",
        content: "hello world",
      });
    });

    it("should call listdir:before hook with path and recursive flag", async () => {
      const beforeHook = vi.fn();
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
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("listdir:before", beforeHook);

      await operations.listdir("/path", true);

      expect(beforeHook).toHaveBeenCalledOnce();
      expect(beforeHook).toHaveBeenCalledWith({
        path: "/path",
        recursive: true,
      });
    });

    it("should call exists:before hook with path", async () => {
      const beforeHook = vi.fn();
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
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("exists:before", beforeHook);

      await operations.exists("test.txt");

      expect(beforeHook).toHaveBeenCalledOnce();
      expect(beforeHook).toHaveBeenCalledWith({ path: "test.txt" });
    });

    it("should call mkdir:before hook with path", async () => {
      const beforeHook = vi.fn();
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
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("mkdir:before", beforeHook);

      assertCapability(operations, "mkdir");
      await operations.mkdir("new-dir");

      expect(beforeHook).toHaveBeenCalledOnce();
      expect(beforeHook).toHaveBeenCalledWith({ path: "new-dir" });
    });

    it("should call rm:before hook with path and options", async () => {
      const beforeHook = vi.fn();
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
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("rm:before", beforeHook);

      assertCapability(operations, "rm");
      await operations.rm("old-file", { recursive: true, force: false });

      expect(beforeHook).toHaveBeenCalledOnce();
      expect(beforeHook).toHaveBeenCalledWith({
        path: "old-file",
        recursive: true,
        force: false,
      });
    });
  });

  describe("after hooks", () => {
    it("should call read:after hook with path and content", async () => {
      const afterHook = vi.fn();
      const mockOperations: FileSystemBridgeOperations = {
        read: vi.fn().mockResolvedValue("file content"),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue([]),
        mkdir: vi.fn().mockResolvedValue(undefined),
        rm: vi.fn().mockResolvedValue(undefined),
      };

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("read:after", afterHook);

      await operations.read("test.txt");

      expect(afterHook).toHaveBeenCalledOnce();
      expect(afterHook).toHaveBeenCalledWith({
        path: "test.txt",
        content: "file content",
      });
    });

    it("should call write:after hook with path", async () => {
      const afterHook = vi.fn();
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
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("write:after", afterHook);

      assertCapability(operations, "write");
      await operations.write("test.txt", "content");

      expect(afterHook).toHaveBeenCalledOnce();
      expect(afterHook).toHaveBeenCalledWith({ path: "test.txt" });
    });

    it("should call listdir:after hook with path, recursive flag, and entries", async () => {
      const afterHook = vi.fn();
      const entries = [
        { type: "file" as const, name: "file1.txt", path: "file1.txt" },
        { type: "file" as const, name: "file2.txt", path: "file2.txt" },
      ];

      const mockOperations: FileSystemBridgeOperations = {
        read: vi.fn().mockResolvedValue("content"),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue(entries),
        mkdir: vi.fn().mockResolvedValue(undefined),
        rm: vi.fn().mockResolvedValue(undefined),
      };

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("listdir:after", afterHook);

      await operations.listdir("/path", false);

      expect(afterHook).toHaveBeenCalledOnce();
      expect(afterHook).toHaveBeenCalledWith({
        path: "/path",
        recursive: false,
        entries,
      });
    });

    it("should call exists:after hook with path and exists boolean", async () => {
      const afterHook = vi.fn();
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
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("exists:after", afterHook);

      await operations.exists("test.txt");

      expect(afterHook).toHaveBeenCalledOnce();
      expect(afterHook).toHaveBeenCalledWith({
        path: "test.txt",
        exists: true,
      });
    });

    it("should call mkdir:after hook with path", async () => {
      const afterHook = vi.fn();
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
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("mkdir:after", afterHook);

      assertCapability(operations, "mkdir");
      await operations.mkdir("new-dir");

      expect(afterHook).toHaveBeenCalledOnce();
      expect(afterHook).toHaveBeenCalledWith({ path: "new-dir" });
    });

    it("should call rm:after hook with path and options", async () => {
      const afterHook = vi.fn();
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
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("rm:after", afterHook);

      assertCapability(operations, "rm");
      await operations.rm("old-file", { recursive: true });

      expect(afterHook).toHaveBeenCalledOnce();
      expect(afterHook).toHaveBeenCalledWith({
        path: "old-file",
        recursive: true,
      });
    });
  });

  describe("error hooks", () => {
    it("should call error hook on async operation error", async () => {
      const errorHook = vi.fn();
      const testError = new Error("Async read error");

      const mockOperations: FileSystemBridgeOperations = {
        read: vi.fn().mockRejectedValue(testError),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue([]),
        mkdir: vi.fn().mockResolvedValue(undefined),
        rm: vi.fn().mockResolvedValue(undefined),
      };

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("error", errorHook);

      await expect(operations.read("test.txt")).rejects.toThrow();

      expect(errorHook).toHaveBeenCalledOnce();
      expect(errorHook).toHaveBeenCalledWith({
        method: "read",
        path: "test.txt",
        error: expect.any(Error),
        args: ["test.txt"],
      });
    });

    it("should call error hook on sync operation error", async () => {
      const errorHook = vi.fn();
      const testError = new Error("Sync write error");

      const mockOperations: FileSystemBridgeOperations = {
        read: vi.fn().mockResolvedValue("content"),
        write: vi.fn().mockImplementation(() => {
          throw testError;
        }),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue([]),
        mkdir: vi.fn().mockResolvedValue(undefined),
        rm: vi.fn().mockResolvedValue(undefined),
      };

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("error", errorHook);

      assertCapability(operations, "write");
      await expect(() => operations.write("test.txt", "content")).rejects.toThrow();

      expect(errorHook).toHaveBeenCalledOnce();
      expect(errorHook).toHaveBeenCalledWith({
        method: "write",
        path: "test.txt",
        error: testError,
        args: ["test.txt", "content"],
      });
    });

    it("should call error hook for unsupported operations", async () => {
      const errorHook = vi.fn();
      const bridge = defineFileSystemBridge({
        meta: {
          name: "Read-only Bridge",
          description: "Bridge without write support",
        },
        setup: () => ({
          read: vi.fn().mockResolvedValue("content"),
          exists: vi.fn().mockResolvedValue(true),
          listdir: vi.fn().mockResolvedValue([]),
        }),
      });

      const operations = bridge();
      operations.hook("error", errorHook);

      await expect(() => operations.write!("test.txt", "content")).rejects.toThrow(
        BridgeUnsupportedOperation,
      );

      expect(errorHook).toHaveBeenCalledOnce();
      expect(errorHook).toHaveBeenCalledWith({
        method: "write",
        path: "test.txt",
        error: expect.any(BridgeUnsupportedOperation),
        args: ["test.txt", "content"],
      });
    });

    it("should call error hook with correct method for different operations", async () => {
      const errorHook = vi.fn();
      const mockOperations: FileSystemBridgeOperations = {
        read: vi.fn().mockRejectedValue(new Error("read error")),
        write: vi.fn().mockRejectedValue(new Error("write error")),
        exists: vi.fn().mockRejectedValue(new Error("exists error")),
        listdir: vi.fn().mockRejectedValue(new Error("listdir error")),
        mkdir: vi.fn().mockRejectedValue(new Error("mkdir error")),
        rm: vi.fn().mockRejectedValue(new Error("rm error")),
      };

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("error", errorHook);

      assertCapability(operations, ["mkdir", "rm", "write"]);

      await expect(operations.read("test.txt")).rejects.toThrow();
      await expect(operations.write("test.txt", "data")).rejects.toThrow();
      await expect(operations.exists("test.txt")).rejects.toThrow();
      await expect(operations.listdir("/")).rejects.toThrow();
      await expect(operations.mkdir("dir")).rejects.toThrow();
      await expect(operations.rm("file")).rejects.toThrow();

      expect(errorHook).toHaveBeenCalledTimes(6);
      expect(errorHook.mock.calls[0]?.[0].method).toBe("read");
      expect(errorHook.mock.calls[1]?.[0].method).toBe("write");
      expect(errorHook.mock.calls[2]?.[0].method).toBe("exists");
      expect(errorHook.mock.calls[3]?.[0].method).toBe("listdir");
      expect(errorHook.mock.calls[4]?.[0].method).toBe("mkdir");
      expect(errorHook.mock.calls[5]?.[0].method).toBe("rm");
    });
  });

  describe("hook registration and execution", () => {
    it("should support multiple handlers for the same hook", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
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
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("read:before", handler1);
      operations.hook("read:before", handler2);
      operations.hook("read:before", handler3);

      await operations.read("test.txt");

      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
      expect(handler3).toHaveBeenCalledOnce();
    });

    it("should call before and after hooks in correct order", async () => {
      const callOrder: string[] = [];
      const mockOperations: FileSystemBridgeOperations = {
        read: vi.fn().mockImplementation(async () => {
          callOrder.push("operation");
          return "content";
        }),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue([]),
        mkdir: vi.fn().mockResolvedValue(undefined),
        rm: vi.fn().mockResolvedValue(undefined),
      };

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("read:before", () => callOrder.push("before"));
      operations.hook("read:after", () => callOrder.push("after"));

      await operations.read("test.txt");

      expect(callOrder).toEqual(["before", "operation", "after"]);
    });

    it("should not call after hook if operation throws", async () => {
      const beforeHook = vi.fn();
      const afterHook = vi.fn();
      const errorHook = vi.fn();
      const mockOperations: FileSystemBridgeOperations = {
        read: vi.fn().mockRejectedValue(new Error("Read failed")),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue([]),
        mkdir: vi.fn().mockResolvedValue(undefined),
        rm: vi.fn().mockResolvedValue(undefined),
      };

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("read:before", beforeHook);
      operations.hook("read:after", afterHook);
      operations.hook("error", errorHook);

      await expect(operations.read("test.txt")).rejects.toThrow();

      expect(beforeHook).toHaveBeenCalledOnce();
      expect(afterHook).not.toHaveBeenCalled();
      expect(errorHook).toHaveBeenCalledOnce();
    });

    it("should not interfere with operation return values", async () => {
      const mockOperations: FileSystemBridgeOperations = {
        read: vi.fn().mockResolvedValue("file content"),
        write: vi.fn().mockResolvedValue(undefined),
        exists: vi.fn().mockResolvedValue(true),
        listdir: vi.fn().mockResolvedValue([
          { type: "file" as const, name: "test.txt", path: "test.txt" },
        ]),
        mkdir: vi.fn().mockResolvedValue(undefined),
        rm: vi.fn().mockResolvedValue(undefined),
      };

      const bridge = defineFileSystemBridge({
        meta: {
          name: "Hook Test Bridge",
          description: "Bridge for testing hooks",
        },
        setup: () => mockOperations,
      });

      const operations = bridge();
      operations.hook("read:before", vi.fn());
      operations.hook("read:after", vi.fn());
      operations.hook("exists:before", vi.fn());
      operations.hook("exists:after", vi.fn());
      operations.hook("listdir:before", vi.fn());
      operations.hook("listdir:after", vi.fn());

      const readResult = await operations.read("test.txt");
      const existsResult = await operations.exists("test.txt");
      const listdirResult = await operations.listdir("/");

      expect(readResult).toBe("file content");
      expect(existsResult).toBe(true);
      expect(listdirResult).toEqual([
        { type: "file", name: "test.txt", path: "test.txt" },
      ]);
    });
  });
});
