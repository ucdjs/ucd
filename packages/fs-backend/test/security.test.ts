import { PathTraversalError } from "@ucdjs/path-utils";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import NodeFileSystemBackend from "../src/backends/node";

describe("node backend security", () => {
  it("blocks simple path traversal attempts", async () => {
    const dir = await testdir({
      "file.txt": "content",
    });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.read("/../etc/passwd")).rejects.toThrow(PathTraversalError);
    await expect(backend.read("/%2e%2e/etc/passwd")).rejects.toThrow(PathTraversalError);
    await expect(backend.read("/valid/../../../etc")).rejects.toThrow(PathTraversalError);
  });

  it("blocks traversal for other operations as well", async () => {
    const dir = await testdir({
      "safe.txt": "content",
    });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.list("/../", { recursive: true })).rejects.toThrow(PathTraversalError);
    await expect(backend.write?.("/../escape.txt", "x")).rejects.toThrow(PathTraversalError);
    await expect(backend.stat("/../escape.txt")).rejects.toThrow(PathTraversalError);
    await expect(backend.copy?.("/safe.txt", "/../escape.txt")).rejects.toThrow(PathTraversalError);
    await expect(backend.remove?.("/../escape.txt")).rejects.toThrow(PathTraversalError);
  });

  it("still allows traversal that stays within the sandbox", async () => {
    const dir = await testdir({
      "subdir": {
        "file.txt": "nested",
      },
      "root.txt": "root",
    });
    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.read("/subdir/../root.txt")).resolves.toBe("root");
  });

  it("blocks symlink traversal that escapes the sandbox", async () => {
    const fsp = await import("node:fs/promises");
    const os = await import("node:os");
    const nodePath = await import("node:path");
    const dir = await testdir({
      "safe.txt": "inside",
    });
    const outsideDir = await fsp.mkdtemp(nodePath.join(os.tmpdir(), "fs-backend-outside-"));
    await fsp.writeFile(nodePath.join(outsideDir, "escape.txt"), "outside");

    await fsp.symlink(outsideDir, nodePath.join(dir, "linked"));

    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.read("/linked/escape.txt")).rejects.toThrow(PathTraversalError);
    await expect(backend.stat("/linked/escape.txt")).rejects.toThrow(PathTraversalError);
    await expect(backend.write("/linked/new.txt", "x")).rejects.toThrow(PathTraversalError);
    await expect(backend.copy("/safe.txt", "/linked/copied.txt")).rejects.toThrow(PathTraversalError);
  });

  it("allows symlinks that still resolve within the sandbox", async () => {
    const fsp = await import("node:fs/promises");
    const nodePath = await import("node:path");
    const dir = await testdir({
      "safe.txt": "inside",
      "nested": {
        "target.txt": "nested",
      },
    });

    await fsp.symlink(nodePath.join(dir, "nested"), nodePath.join(dir, "linked"));

    const backend = NodeFileSystemBackend({ basePath: dir });

    await expect(backend.read("/linked/target.txt")).resolves.toBe("nested");
  });
});
