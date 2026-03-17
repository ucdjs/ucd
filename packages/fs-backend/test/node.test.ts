import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import NodeFileSystemBackend from "../src/backends/node";

describe("node backend", () => {
  it("lists files with canonical paths", async () => {
    const dir = await testdir({
      "foo.txt": "hello",
      nested: {
        "bar.txt": "world",
      },
    });

    const backend = NodeFileSystemBackend({ basePath: dir });
    const entries = await backend.list("/", { recursive: true });

    expect(entries).toHaveLength(2);
    expect(entries.some((entry) => entry.path === "/foo.txt")).toBe(true);
    expect(entries.some((entry) => entry.path === "/nested/")).toBe(true);
  });

  it("supports stat and copy", async () => {
    const dir = await testdir({
      "foo.txt": "hello",
    });

    const backend = NodeFileSystemBackend({ basePath: dir });
    const stat = await backend.stat("/foo.txt");

    expect(stat.type).toBe("file");
    expect(stat.size).toBeGreaterThan(0);

    await backend.copy?.("/foo.txt", "/copied.txt");

    await expect(backend.read("/copied.txt")).resolves.toBe("hello");
  });
});
