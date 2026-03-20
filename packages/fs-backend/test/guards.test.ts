import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { assertFeature } from "../src/assertions";
import HTTPFileSystemBackend from "../src/backends/http";
import NodeFileSystemBackend from "../src/backends/node";
import { BackendUnsupportedOperation } from "../src/errors";
import { hasFeature, isHttpBackend } from "../src/guards";

describe("guards and assertions", () => {
  it("hasFeature reflects backend capabilities", async () => {
    const dir = await testdir();
    const nodeBackend = NodeFileSystemBackend({ basePath: dir });
    const httpBackend = HTTPFileSystemBackend();

    expect(hasFeature(nodeBackend, "write")).toBe(true);
    expect(hasFeature(nodeBackend, ["write", "mkdir", "remove", "copy"])).toBe(true);
    expect(hasFeature(httpBackend, "write")).toBe(false);
  });

  it("assertFeature throws BackendUnsupportedOperation for unsupported features", () => {
    const httpBackend = HTTPFileSystemBackend();

    expect(() => assertFeature(httpBackend, "write")).toThrow(BackendUnsupportedOperation);
  });

  it("assertFeature allows calling supported mutable operations", async () => {
    const dir = await testdir();
    const backend = NodeFileSystemBackend({ basePath: dir });

    expect(() => assertFeature(backend, "copy")).not.toThrow();

    if (hasFeature(backend, "copy")) {
      await expect(backend.copy("/missing.txt", "/copy.txt")).rejects.toThrow();
    }
  });

  it("isHttpBackend detects the built-in http backend", async () => {
    const dir = await testdir();

    expect(isHttpBackend(HTTPFileSystemBackend())).toBe(true);
    expect(isHttpBackend(NodeFileSystemBackend({ basePath: dir }))).toBe(false);
  });
});
