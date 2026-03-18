import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import NodeFileSystemBackend from "../src/backends/node";
import { BackendEntryIsDirectory, BackendFileNotFound } from "../src/errors";

describe("node backend", () => {
  it("reads existing files", async () => {
    const dir = await testdir({ "hello.txt": "world" });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.read("/hello.txt")).resolves.toBe("world");
  });

  it("throws BackendFileNotFound for missing files", async () => {
    const dir = await testdir();
    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.read("/missing.txt")).rejects.toThrow(BackendFileNotFound);
  });

  it("throws BackendEntryIsDirectory when reading a directory", async () => {
    const dir = await testdir({ folder: {} });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.read("/")).rejects.toThrow(BackendEntryIsDirectory);
    await expect(backend.read("/folder/")).rejects.toThrow(BackendEntryIsDirectory);
  });

  it("reads bytes from existing files", async () => {
    const dir = await testdir({ "hello.txt": "world" });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.readBytes("/hello.txt")).resolves.toEqual(new TextEncoder().encode("world"));
  });

  it("lists entries non-recursively with canonical paths", async () => {
    const dir = await testdir({
      "foo.txt": "hello",
      "nested": {
        "bar.txt": "world",
      },
    });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.list("/")).resolves.toEqual([
      { type: "file", name: "foo.txt", path: "/foo.txt" },
      { type: "directory", name: "nested", path: "/nested/", children: [] },
    ]);
  });

  it("lists entries recursively with a nested tree", async () => {
    const dir = await testdir({
      "root.txt": "root",
      "nested": {
        "bar.txt": "world",
        "deep": {
          "baz.txt": "ok",
        },
      },
    });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.list("/", { recursive: true })).resolves.toEqual([
      {
        type: "directory",
        name: "nested",
        path: "/nested/",
        children: [
          { type: "file", name: "bar.txt", path: "/nested/bar.txt" },
          {
            type: "directory",
            name: "deep",
            path: "/nested/deep/",
            children: [
              { type: "file", name: "baz.txt", path: "/nested/deep/baz.txt" },
            ],
          },
        ],
      },
      { type: "file", name: "root.txt", path: "/root.txt" },
    ]);
  });

  it("reports existence correctly", async () => {
    const dir = await testdir({ "hello.txt": "world" });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.exists("/hello.txt")).resolves.toBe(true);
    await expect(backend.exists("/nope.txt")).resolves.toBe(false);
  });

  it("writes files and creates parent directories", async () => {
    const dir = await testdir();
    const backend = NodeFileSystemBackend({ basePath: dir });

    await backend.write?.("/deep/nested/new.txt", "data");

    await expect(backend.read("/deep/nested/new.txt")).resolves.toBe("data");
    await expect(backend.exists("/deep/nested/")).resolves.toBe(true);
  });

  it("creates directories", async () => {
    const dir = await testdir();
    const backend = NodeFileSystemBackend({ basePath: dir });

    await backend.mkdir?.("/subdir/");

    await expect(backend.exists("/subdir/")).resolves.toBe(true);
    await expect(backend.stat("/subdir/")).resolves.toMatchObject({
      type: "directory",
    });
  });

  it("removes files and directories", async () => {
    const dir = await testdir({
      "hello.txt": "world",
      "subdir": {
        "nested.txt": "content",
      },
    });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await backend.remove?.("/hello.txt");
    await expect(backend.exists("/hello.txt")).resolves.toBe(false);

    await backend.remove?.("/subdir/", { recursive: true });
    await expect(backend.exists("/subdir/")).resolves.toBe(false);
  });

  it("copies files", async () => {
    const dir = await testdir({
      "foo.txt": "hello",
    });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await backend.copy?.("/foo.txt", "/copied.txt");

    await expect(backend.read("/copied.txt")).resolves.toBe("hello");
  });

  it("returns stat information for files", async () => {
    const dir = await testdir({
      "foo.txt": "hello",
    });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.stat("/foo.txt")).resolves.toMatchObject({
      type: "file",
      size: 5,
    });
  });
});
