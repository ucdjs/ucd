import { Buffer } from "node:buffer";
import { assertCapability, BridgeUnsupportedOperation } from "@ucdjs/fs-bridge";
import { assert, describe, expect, it } from "vitest";
import { createMemoryMockFS } from "../../src/fs-bridges/memory-fs-bridge";

describe("memory fs bridge", () => {
  it("should initialize with files from options", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        "file.txt": "content",
        "nested/file.txt": "nested content",
      },
    });

    expect(await fs.read("file.txt")).toBe("content");
    expect(await fs.read("nested/file.txt")).toBe("nested content");
  });

  it("should initialize without files", async () => {
    const fs = createMemoryMockFS();
    expect(await fs.exists("file.txt")).toBe(false);
  });

  it("should read existing file", async () => {
    const fs = createMemoryMockFS({
      initialFiles: { "file.txt": "content" },
    });
    expect(await fs.read("file.txt")).toBe("content");
  });

  it("should allow overriding functions via options", async () => {
    const fs = createMemoryMockFS({
      functions: {
        read: async (path: string) => `overridden:${path}`,
      },
    });

    expect(await fs.read("file.txt")).toBe("overridden:file.txt");
  });

  it("should disable optional functions when set to false", async () => {
    const fs = createMemoryMockFS({
      functions: {
        write: false,
      },
    });

    expect(() => assertCapability(fs, "write")).toThrow(BridgeUnsupportedOperation);
    await expect(fs.write!("file.txt", "content")).rejects.toBeInstanceOf(BridgeUnsupportedOperation);
  });

  it("should throw when disabling required function via false", async () => {
    const fs = createMemoryMockFS({
      functions: {
        read: false,
      },
    });

    await expect(fs.read("file.txt")).rejects.toBeInstanceOf(BridgeUnsupportedOperation);
  });

  it("should throw ENOENT for non-existent file", async () => {
    const fs = createMemoryMockFS();
    await expect(fs.read("missing.txt")).rejects.toThrow("ENOENT: no such file or directory, open 'missing.txt'");
  });

  it("should write string content", async () => {
    const fs = createMemoryMockFS();

    assertCapability(fs, "write");
    await fs.write("file.txt", "content");
    expect(await fs.read("file.txt")).toBe("content");
  });

  it("should write buffer content", async () => {
    const fs = createMemoryMockFS();

    assertCapability(fs, "write");
    await fs.write("file.txt", Buffer.from("buffer content"));
    expect(await fs.read("file.txt")).toBe("buffer content");
  });

  it("should overwrite existing file", async () => {
    const fs = createMemoryMockFS({
      initialFiles: { "file.txt": "old content" },
    });

    assertCapability(fs, "write");
    await fs.write("file.txt", "new content");
    expect(await fs.read("file.txt")).toBe("new content");
  });

  it("should return true for existing file", async () => {
    const fs = createMemoryMockFS({
      initialFiles: { "file.txt": "content" },
    });

    expect(await fs.exists("file.txt")).toBe(true);
  });

  it("should return false for non-existent file", async () => {
    const fs = createMemoryMockFS();
    expect(await fs.exists("missing.txt")).toBe(false);
  });

  it("should return true for implicit directory", async () => {
    const fs = createMemoryMockFS({
      initialFiles: { "dir/file.txt": "content" },
    });

    expect(await fs.exists("dir")).toBe(true);
  });

  it("should return true for root paths", async () => {
    const fs = createMemoryMockFS({
      initialFiles: { "file.txt": "content" },
    });

    expect(await fs.exists("")).toBe(true);
    expect(await fs.exists(".")).toBe(true);
    expect(await fs.exists("/")).toBe(true);
  });

  describe("listdir", () => {
    it("should list files in root directory", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "file1.txt": "content1",
          "file2.txt": "content2",
        },
      });

      const entries = await fs.listdir("", false);
      expect(entries).toHaveLength(2);
      expect(entries).toEqual(expect.arrayContaining([
        { type: "file", name: "file1.txt", path: "/file1.txt" },
        { type: "file", name: "file2.txt", path: "/file2.txt" },
      ]));
    });

    it("should list files and implicit directories", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "file.txt": "content",
          "dir/nested.txt": "nested content",
        },
      });

      const entries = await fs.listdir("", false);
      expect(entries).toHaveLength(2);
      expect(entries).toEqual(expect.arrayContaining([
        { type: "file", name: "file.txt", path: "/file.txt" },
        { type: "directory", name: "dir", path: "/dir/", children: [] },
      ]));
    });

    it("should list subdirectory contents", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "dir/file1.txt": "content1",
          "dir/file2.txt": "content2",
          "dir/nested/deep.txt": "deep content",
        },
      });

      const entries = await fs.listdir("dir", false);
      expect(entries).toHaveLength(3);
      expect(entries).toEqual(expect.arrayContaining([
        { type: "file", name: "file1.txt", path: "/dir/file1.txt" },
        { type: "file", name: "file2.txt", path: "/dir/file2.txt" },
        { type: "directory", name: "nested", path: "/dir/nested/", children: [] },
      ]));
    });

    it("should return empty array for non-existent directory", async () => {
      const fs = createMemoryMockFS();
      const entries = await fs.listdir("missing", false);
      expect(entries).toEqual([]);
    });

    it("should list files recursively", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "file.txt": "content",
          "dir/nested.txt": "nested content",
          "dir/deep/file.txt": "deep content",
        },
      });

      const entries = await fs.listdir("", true);
      expect(entries).toHaveLength(2);

      const fileEntry = entries.find((e) => e.type === "file");
      expect(fileEntry).toEqual({ type: "file", name: "file.txt", path: "/file.txt" });

      const dirEntry = entries.find((e) => e.type === "directory" && e.name === "dir");
      expect(dirEntry).toBeDefined();
      if (dirEntry?.type === "directory") {
        expect(dirEntry.children).toHaveLength(2);
        expect(dirEntry.children).toEqual(expect.arrayContaining([
          { type: "file", name: "nested.txt", path: "/dir/nested.txt" },
          {
            type: "directory",
            name: "deep",
            path: "/dir/deep/",
            children: [{ type: "file", name: "file.txt", path: "/dir/deep/file.txt" }],
          },
        ]));
      }
    });

    it("should build deeply nested directory structure", async () => {
      const fs = createMemoryMockFS({
        initialFiles: { "a/b/c/file.txt": "deep content" },
      });

      const entries = await fs.listdir("", true);
      expect(entries).toHaveLength(1);

      const aDir = entries[0];
      assert(aDir != null, "Expected 'a' directory to exist");
      assert(aDir.type === "directory", "Expected directory");

      expect(aDir.name).toBe("a");
      expect(aDir.children).toHaveLength(1);

      const bDir = aDir.children[0];
      assert(bDir != null, "Expected 'b' directory to exist");
      assert(bDir.type === "directory", "Expected directory");

      expect(bDir.name).toBe("b");
      expect(bDir.children).toHaveLength(1);

      const cDir = bDir.children[0];
      assert(cDir != null, "Expected 'c' directory to exist");
      assert(cDir.type === "directory", "Expected directory");

      expect(cDir.name).toBe("c");
      expect(cDir.children).toHaveLength(1);

      expect(cDir.children[0]).toEqual({ type: "file", name: "file.txt", path: "/a/b/c/file.txt" });
    });
  });

  it("should create directories with mkdir", async () => {
    const fs = createMemoryMockFS();

    assertCapability(fs, "mkdir");
    await fs.mkdir("dir");
    expect(await fs.exists("dir")).toBe(true);
  });

  it("should create nested directories with mkdir", async () => {
    const fs = createMemoryMockFS();

    assertCapability(fs, "mkdir");
    await fs.mkdir("a/b/c");
    expect(await fs.exists("a")).toBe(true);
    expect(await fs.exists("a/b")).toBe(true);
    expect(await fs.exists("a/b/c")).toBe(true);
  });

  it("should list explicitly created empty directories", async () => {
    const fs = createMemoryMockFS();

    assertCapability(fs, "mkdir");
    await fs.mkdir("emptydir");
    const entries = await fs.listdir("", false);
    expect(entries).toEqual([{ type: "directory", name: "emptydir", path: "/emptydir/", children: [] }]);
  });

  it("should throw EISDIR when reading a directory", async () => {
    const fs = createMemoryMockFS();

    assertCapability(fs, "mkdir");
    await fs.mkdir("dir");
    await expect(fs.read("dir/")).rejects.toThrow("EISDIR: illegal operation on a directory, read 'dir/'");
  });

  it("should remove explicit directory with rm", async () => {
    const fs = createMemoryMockFS();

    assertCapability(fs, ["mkdir", "rm"]);
    await fs.mkdir("dir");
    expect(await fs.exists("dir")).toBe(true);
    await fs.rm("dir");
    expect(await fs.exists("dir")).toBe(false);
  });

  it("should allow writing files after mkdir", async () => {
    const fs = createMemoryMockFS();

    assertCapability(fs, ["mkdir", "write"]);
    await fs.mkdir("dir");
    await fs.write("dir/file.txt", "content");
    expect(await fs.exists("dir")).toBe(true);
  });

  it("should remove existing file", async () => {
    const fs = createMemoryMockFS({
      initialFiles: { "file.txt": "content" },
    });

    assertCapability(fs, "rm");
    await fs.rm("file.txt");
    expect(await fs.exists("file.txt")).toBe(false);
  });

  it("should not throw when removing non-existent file", async () => {
    const fs = createMemoryMockFS();

    assertCapability(fs, "rm");
    await expect(fs.rm("missing.txt")).resolves.toBeUndefined();
  });

  it("should remove directory recursively", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        "dir/file1.txt": "content1",
        "dir/nested/deep.txt": "deep content",
      },
    });

    assertCapability(fs, "rm");
    await fs.rm("dir", { recursive: true });
    expect(await fs.exists("dir")).toBe(false);
    expect(await fs.exists("dir/file1.txt")).toBe(false);
    expect(await fs.exists("dir/nested/deep.txt")).toBe(false);
  });

  it("should not remove directory without recursive option", async () => {
    const fs = createMemoryMockFS({
      initialFiles: { "dir/file.txt": "content" },
    });

    assertCapability(fs, "rm");
    await fs.rm("dir");
    expect(await fs.exists("dir")).toBe(true);
    expect(await fs.exists("dir/file.txt")).toBe(true);
  });

  it("should handle removing root recursively", async () => {
    const fs = createMemoryMockFS({
      initialFiles: {
        "file1.txt": "content1",
        "dir/nested.txt": "nested content",
      },
    });

    assertCapability(fs, "rm");
    await fs.rm("", { recursive: true });
    expect(await fs.exists("file1.txt")).toBe(false);
    expect(await fs.exists("dir/nested.txt")).toBe(false);
  });

  it("should handle paths with trailing slashes", async () => {
    const fs = createMemoryMockFS({
      initialFiles: { "dir/file.txt": "content" },
    });

    expect(await fs.exists("dir/")).toBe(true);
    const entries = await fs.listdir("dir/", false);
    expect(entries).toHaveLength(1);
  });

  it("should treat root paths equivalently", async () => {
    const fs = createMemoryMockFS({
      initialFiles: { "file.txt": "content" },
    });

    const entries1 = await fs.listdir("", false);
    const entries2 = await fs.listdir(".", false);
    const entries3 = await fs.listdir("/", false);

    expect(entries1).toEqual(entries2);
    expect(entries2).toEqual(entries3);
  });
});
