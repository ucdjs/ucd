import { describe, expect, it } from "vitest";
import { defineBackend, hasFeature } from "../src";

describe("defineBackend", () => {
  it("infers mutable features from setup operations", async () => {
    const backend = defineBackend({
      meta: {
        name: "test",
      },
      setup() {
        return {
          async read() {
            return "content";
          },
          async readBytes() {
            return new Uint8Array([99]);
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
          async copy() {},
        };
      },
    })();

    expect(backend.features.has("write")).toBe(true);
    expect(backend.features.has("copy")).toBe(true);
    expect(backend.features.has("mkdir")).toBe(false);
    expect(hasFeature(backend, "write")).toBe(true);
    await expect(backend.read("/file.txt")).resolves.toBe("content");
    await expect(backend.readBytes("/file.txt")).resolves.toEqual(new Uint8Array([99]));
  });
});
