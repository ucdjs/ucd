import { resolve } from "node:path";
import NodeFileSystemBridge from "#internal:bridge/node";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { assertCapability } from "../src";

describe("bridge methods with all path scenarios", () => {
  describe("read method", () => {
    describe("with relative basePath", () => {
      it("should read file with relative path", async () => {
        const testDir = await testdir({
          "file.txt": "content",
        });
        const bridge = NodeFileSystemBridge({ basePath: testDir });

        const content = await bridge.read("file.txt");
        expect(content).toBe("content");
      });

      it("should read file with nested relative path", async () => {
        const testDir = await testdir({
          "v16.0.0": {
            "file.txt": "content",
          },
        });
        const bridge = NodeFileSystemBridge({ basePath: testDir });

        const content = await bridge.read("v16.0.0/file.txt");
        expect(content).toBe("content");
      });

      it("should read file with absolute path (virtual filesystem)", async () => {
        const testDir = await testdir({
          "file.txt": "content",
        });
        const bridge = NodeFileSystemBridge({ basePath: testDir });

        const content = await bridge.read("/file.txt");
        expect(content).toBe("content");
      });
    });

    describe("with absolute basePath", () => {
      it("should read file with relative path", async () => {
        const testDir = await testdir({
          "file.txt": "content",
        });
        const absoluteBasePath = resolve(testDir);
        const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

        const content = await bridge.read("file.txt");
        expect(content).toBe("content");
      });

      it("should read file with absolute path within basePath", async () => {
        const testDir = await testdir({
          "file.txt": "content",
        });
        const absoluteBasePath = resolve(testDir);
        const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

        const content = await bridge.read(`${absoluteBasePath}/file.txt`);
        expect(content).toBe("content");
      });
    });
  });

  describe("write method", () => {
    describe("with relative basePath", () => {
      it("should write file with relative path", async () => {
        const testDir = await testdir();
        const bridge = NodeFileSystemBridge({ basePath: testDir });
        assertCapability(bridge, "write");

        await bridge.write("file.txt", "content");
        const content = await bridge.read("file.txt");
        expect(content).toBe("content");
      });

      it("should write file with nested relative path", async () => {
        const testDir = await testdir();
        const bridge = NodeFileSystemBridge({ basePath: testDir });
        assertCapability(bridge, "write");

        await bridge.write("v16.0.0/file.txt", "content");
        const content = await bridge.read("v16.0.0/file.txt");
        expect(content).toBe("content");
      });
    });

    describe("with absolute basePath", () => {
      it("should write file with relative path", async () => {
        const testDir = await testdir();
        const absoluteBasePath = resolve(testDir);
        const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });
        assertCapability(bridge, "write");

        await bridge.write("file.txt", "content");
        const content = await bridge.read("file.txt");
        expect(content).toBe("content");
      });
    });
  });

  describe("exists method", () => {
    describe("with relative basePath", () => {
      it("should check existence with relative path", async () => {
        const testDir = await testdir({
          "file.txt": "content",
        });
        const bridge = NodeFileSystemBridge({ basePath: testDir });

        expect(await bridge.exists("file.txt")).toBe(true);
        expect(await bridge.exists("missing.txt")).toBe(false);
      });

      it("should check existence with absolute path (virtual filesystem)", async () => {
        const testDir = await testdir({
          "file.txt": "content",
        });
        const bridge = NodeFileSystemBridge({ basePath: testDir });

        expect(await bridge.exists("/file.txt")).toBe(true);
      });
    });

    describe("with absolute basePath", () => {
      it("should check existence with relative path", async () => {
        const testDir = await testdir({
          "file.txt": "content",
        });
        const absoluteBasePath = resolve(testDir);
        const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

        expect(await bridge.exists("file.txt")).toBe(true);
        expect(await bridge.exists("missing.txt")).toBe(false);
      });
    });
  });

  describe("listdir method", () => {
    describe("with relative basePath", () => {
      it("should list directory with relative path", async () => {
        const testDir = await testdir({
          "file1.txt": "content1",
          "file2.txt": "content2",
          "subdir": {},
        });
        const bridge = NodeFileSystemBridge({ basePath: testDir });

        const entries = await bridge.listdir("");
        expect(entries).toHaveLength(3);
      });

      it("should list nested directory", async () => {
        const testDir = await testdir({
          "v16.0.0": {
            "file1.txt": "content1",
            "file2.txt": "content2",
          },
        });
        const bridge = NodeFileSystemBridge({ basePath: testDir });

        const entries = await bridge.listdir("v16.0.0");
        expect(entries).toHaveLength(2);
      });

      it("should list recursively", async () => {
        const testDir = await testdir({
          "v16.0.0": {
            "file1.txt": "content1",
            "subdir": {
              "file2.txt": "content2",
            },
          },
        });
        const bridge = NodeFileSystemBridge({ basePath: testDir });

        const entries = await bridge.listdir("v16.0.0", true);
        expect(entries.length).toBeGreaterThan(0);
      });
    });

    describe("with absolute basePath", () => {
      it("should list directory with relative path", async () => {
        const testDir = await testdir({
          "file1.txt": "content1",
          "file2.txt": "content2",
          "subdir": {},
        });
        const absoluteBasePath = resolve(testDir);
        const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });

        const entries = await bridge.listdir("");
        expect(entries).toHaveLength(3);
      });
    });
  });

  describe("mkdir method", () => {
    describe("with relative basePath", () => {
      it("should create directory with relative path", async () => {
        const testDir = await testdir();
        const bridge = NodeFileSystemBridge({ basePath: testDir });
        assertCapability(bridge, "mkdir");

        await bridge.mkdir("newdir");
        expect(await bridge.exists("newdir")).toBe(true);
      });

      it("should create nested directories", async () => {
        const testDir = await testdir();
        const bridge = NodeFileSystemBridge({ basePath: testDir });
        assertCapability(bridge, "mkdir");

        await bridge.mkdir("v16.0.0/subdir");
        expect(await bridge.exists("v16.0.0/subdir")).toBe(true);
      });
    });

    describe("with absolute basePath", () => {
      it("should create directory with relative path", async () => {
        const testDir = await testdir();
        const absoluteBasePath = resolve(testDir);
        const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });
        assertCapability(bridge, "mkdir");

        await bridge.mkdir("newdir");
        expect(await bridge.exists("newdir")).toBe(true);
      });
    });
  });

  describe("rm method", () => {
    describe("with relative basePath", () => {
      it("should remove file with relative path", async () => {
        const testDir = await testdir({
          "file.txt": "content",
        });
        const bridge = NodeFileSystemBridge({ basePath: testDir });
        assertCapability(bridge, "rm");

        await bridge.rm("file.txt");
        expect(await bridge.exists("file.txt")).toBe(false);
      });

      it("should remove directory recursively", async () => {
        const testDir = await testdir({
          subdir: {
            "file.txt": "content",
          },
        });
        const bridge = NodeFileSystemBridge({ basePath: testDir });
        assertCapability(bridge, "rm");

        await bridge.rm("subdir", { recursive: true });
        expect(await bridge.exists("subdir")).toBe(false);
      });
    });

    describe("with absolute basePath", () => {
      it("should remove file with relative path", async () => {
        const testDir = await testdir({
          "file.txt": "content",
        });
        const absoluteBasePath = resolve(testDir);
        const bridge = NodeFileSystemBridge({ basePath: absoluteBasePath });
        assertCapability(bridge, "rm");

        await bridge.rm("file.txt");
        expect(await bridge.exists("file.txt")).toBe(false);
      });
    });
  });
});
