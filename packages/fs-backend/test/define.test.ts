import type { FileSystemBackendMutableOperations, FileSystemBackendOperations } from "../src/types";
import { assert, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import HTTPFileSystemBackend from "../src/backends/http";
import NodeFileSystemBackend from "../src/backends/node";
import { defineBackend } from "../src/define";
import { BackendSetupError } from "../src/errors";

describe("defineBackend", () => {
  it("returns a working backend factory", async () => {
    const createBackend = defineBackend({
      meta: {
        name: "Test Backend",
      },
      setup() {
        return {
          async read(path) {
            return `content:${path}`;
          },
          async readBytes() {
            return new Uint8Array([1]);
          },
          async list() {
            return [];
          },
          async exists() {
            return true;
          },
          async stat() {
            return {
              type: "file" as const,
              size: 1,
            };
          },
        };
      },
    });

    const backend = createBackend();

    expect(typeof createBackend).toBe("function");
    expect(backend.meta.name).toBe("Test Backend");
    await expect(backend.read("/file.txt")).resolves.toBe("content:/file.txt");
  });

  it("throws BackendSetupError when setup throws", () => {
    const originalError = new Error("setup failed");
    const createBackend = defineBackend({
      meta: {
        name: "Broken Backend",
      },
      setup() {
        throw originalError;
      },
    });

    try {
      createBackend();
      expect.fail("Expected backend creation to throw");
    } catch (error) {
      assert.instanceOf(error, BackendSetupError);
      expect(error.originalError).toBe(originalError);
      expect(error.cause).toBe(originalError);
    }
  });

  it("throws BackendSetupError when a required operation is missing", () => {
    const createBackend = defineBackend({
      meta: {
        name: "Missing Operation Backend",
      },
      setup() {
        return {
          async read() {
            return "content";
          },
          async readBytes() {
            return new Uint8Array([1]);
          },
          async list() {
            return [];
          },
          async exists() {
            return true;
          },
        } as unknown as FileSystemBackendOperations & FileSystemBackendMutableOperations;
      },
    });

    expect(() => createBackend()).toThrowError(
      new BackendSetupError("Backend is missing required operation: stat"),
    );
  });

  it("validates options with the provided Zod schema", () => {
    const createBackend = defineBackend({
      meta: {
        name: "Options Backend",
      },
      optionsSchema: z.object({
        baseUrl: z.url(),
      }),
      setup(options) {
        return {
          async read() {
            return options.baseUrl;
          },
          async readBytes() {
            return new Uint8Array([1]);
          },
          async list() {
            return [];
          },
          async exists() {
            return true;
          },
          async stat() {
            return {
              type: "file" as const,
              size: 1,
            };
          },
        };
      },
    });

    expect(() => createBackend({ baseUrl: "https://example.com" })).not.toThrow();
    expect(() => createBackend({ baseUrl: "not-a-url" })).toThrow("Invalid options provided");
  });

  it("supports factories without args when no options schema is provided", () => {
    const createBackend = defineBackend({
      meta: {
        name: "No Options Backend",
      },
      setup() {
        return {
          async read() {
            return "content";
          },
          async readBytes() {
            return new Uint8Array([1]);
          },
          async list() {
            return [];
          },
          async exists() {
            return true;
          },
          async stat() {
            return {
              type: "file" as const,
              size: 1,
            };
          },
        };
      },
    });

    expect(() => createBackend()).not.toThrow();
  });

  it("infers features from mutable operations", () => {
    const backend = defineBackend({
      meta: {
        name: "Mutable Backend",
      },
      setup() {
        return {
          async read() {
            return "content";
          },
          async readBytes() {
            return new Uint8Array([1]);
          },
          async list() {
            return [];
          },
          async exists() {
            return true;
          },
          async stat() {
            return {
              type: "file" as const,
              size: 1,
            };
          },
          async write() {},
          async mkdir() {},
          async remove() {},
          async copy() {},
        };
      },
    })();

    expect(backend.features.has("write")).toBe(true);
    expect(backend.features.has("mkdir")).toBe(true);
    expect(backend.features.has("remove")).toBe(true);
    expect(backend.features.has("copy")).toBe(true);
    expect(NodeFileSystemBackend({ basePath: "/" }).features).toEqual(new Set(["write", "mkdir", "remove", "copy"]));
    expect(HTTPFileSystemBackend().features.size).toBe(0);
  });

  it("fires before and after hooks around operations", async () => {
    const beforeHook = vi.fn();
    const afterHook = vi.fn();
    const backend = defineBackend({
      meta: {
        name: "Hooked Backend",
      },
      setup() {
        return {
          async read() {
            return "content";
          },
          async readBytes() {
            return new Uint8Array([1]);
          },
          async list() {
            return [];
          },
          async exists() {
            return true;
          },
          async stat() {
            return {
              type: "file" as const,
              size: 1,
            };
          },
        };
      },
    })();

    backend.hook("read:before", beforeHook);
    backend.hook("read:after", afterHook);

    await backend.read("/file.txt");

    expect(beforeHook).toHaveBeenCalledWith({ path: "/file.txt" });
    expect(afterHook).toHaveBeenCalledWith({
      path: "/file.txt",
      content: "content",
    });
  });

  it("fires the error hook when an operation throws", async () => {
    const errorHook = vi.fn();
    const backend = defineBackend({
      meta: {
        name: "Error Backend",
      },
      setup() {
        return {
          async read() {
            throw new Error("boom");
          },
          async readBytes() {
            return new Uint8Array([1]);
          },
          async list() {
            return [];
          },
          async exists() {
            return true;
          },
          async stat() {
            return {
              type: "file" as const,
              size: 1,
            };
          },
        };
      },
    })();

    backend.hook("error", errorHook);

    await expect(backend.read("/file.txt")).rejects.toThrow("Unexpected error in 'read' operation");

    expect(errorHook).toHaveBeenCalledWith({
      op: "read",
      path: "/file.txt",
      error: expect.any(Error),
    });
  });

  it("attaches the provided symbol brand to the backend instance", () => {
    const brand = Symbol("test-brand");
    const backend = defineBackend({
      meta: {
        name: "Branded Backend",
      },
      symbol: brand,
      setup() {
        return {
          async read() {
            return "content";
          },
          async readBytes() {
            return new Uint8Array([1]);
          },
          async list() {
            return [];
          },
          async exists() {
            return true;
          },
          async stat() {
            return {
              type: "file" as const,
              size: 1,
            };
          },
        };
      },
    })();

    expect((backend as unknown as Record<symbol, boolean>)[brand]).toBe(true);
  });
});
