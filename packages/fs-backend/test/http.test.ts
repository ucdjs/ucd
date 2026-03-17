import { describe, expect, it, vi } from "vitest";
import HTTPFileSystemBackend from "../src/backends/http";

describe("http backend", () => {
  it("is read-only", () => {
    const backend = HTTPFileSystemBackend();

    expect(backend.features.has("write")).toBe(false);
    expect(backend.features.has("mkdir")).toBe(false);
    expect(backend.features.has("remove")).toBe(false);
  });

  it("checks existence via HEAD", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const backend = HTTPFileSystemBackend();
    await expect(backend.exists("/foo.txt")).resolves.toBe(true);
  });

  it("supports readBytes and stat", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          "content-length": "3",
          "last-modified": "Tue, 17 Mar 2026 10:00:00 GMT",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const backend = HTTPFileSystemBackend();

    await expect(backend.readBytes("/foo.bin")).resolves.toEqual(new Uint8Array([1, 2, 3]));

    await expect(backend.stat("/foo.bin")).resolves.toMatchObject({
      type: "file",
      size: 3,
    });
  });
});
