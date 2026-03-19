import type { BackendEntry } from "../src";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCD_STAT_SIZE_HEADER, UCD_STAT_TYPE_HEADER } from "@ucdjs/env";
import { describe, expect, it, vi } from "vitest";
import HTTPFileSystemBackend from "../src/backends/http";
import NodeFileSystemBackend from "../src/backends/node";
import { BackendFileNotFound } from "../src/errors";
import { isHttpBackend } from "../src/guards";

describe("http backend", () => {
  const baseUrl = new URL("https://ucdjs.dev/");

  it("reads file content successfully", async () => {
    mockFetch([
      ["GET", "https://ucdjs.dev/file.txt", () =>
        new HttpResponse("hello", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.read("/file.txt")).resolves.toBe("hello");
  });

  it("throws BackendFileNotFound for missing reads", async () => {
    mockFetch([
      ["GET", "https://ucdjs.dev/file.txt", () =>
        new HttpResponse("missing", {
          status: 404,
          statusText: "Not Found",
        })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.read("/file.txt")).rejects.toThrow(BackendFileNotFound);
  });

  it("throws for server read failures", async () => {
    mockFetch([
      ["GET", "https://ucdjs.dev/file.txt", () =>
        new HttpResponse("error", {
          status: 500,
          statusText: "Internal Server Error",
        })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.read("/file.txt")).rejects.toThrow("Failed to read remote file: Internal Server Error");
  });

  it("lists valid BackendEntry responses", async () => {
    const entries = [
      { type: "directory", name: "nested", path: "/nested/" },
      { type: "file", name: "foo.txt", path: "/foo.txt" },
    ] satisfies Array<
      | { type: "file"; name: string; path: string }
      | { type: "directory"; name: string; path: string }
    >;

    mockFetch([
      ["GET", "https://ucdjs.dev/", () => HttpResponse.json(entries)],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.list("/")).resolves.toEqual([
      { type: "file", name: "foo.txt", path: "/foo.txt" },
      { type: "directory", name: "nested", path: "/nested/", children: [] },
    ] satisfies BackendEntry[]);
  });

  it("lists recursively by following directory entries", async () => {
    mockFetch([
      ["GET", "https://ucdjs.dev/dir", () => HttpResponse.json([
        { type: "directory", name: "nested", path: "/dir/nested/" },
        { type: "file", name: "foo.txt", path: "/dir/foo.txt" },
      ])],
      ["GET", "https://ucdjs.dev/dir/nested", () => HttpResponse.json([
        { type: "file", name: "bar.txt", path: "/dir/nested/bar.txt" },
      ])],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.list("/dir", { recursive: true })).resolves.toEqual([
      { type: "file", name: "foo.txt", path: "/dir/foo.txt" },
      {
        type: "directory",
        name: "nested",
        path: "/dir/nested/",
        children: [
          { type: "file", name: "bar.txt", path: "/dir/nested/bar.txt" },
        ],
      },
    ]);
  });

  it("throws BackendFileNotFound for missing list responses", async () => {
    mockFetch([
      ["GET", "https://ucdjs.dev/missing", () => new HttpResponse(null, { status: 404 })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.list("/missing")).rejects.toThrow(BackendFileNotFound);
  });

  it("preserves nested recursive list failures in the error hook", async () => {
    mockFetch([
      ["GET", "https://ucdjs.dev/dir", () => HttpResponse.json([
        { type: "directory", name: "nested", path: "/dir/nested/" },
      ])],
      ["GET", "https://ucdjs.dev/dir/nested", () => new HttpResponse(null, { status: 404 })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    const errorHook = vi.fn();
    backend.hook("error", errorHook);

    await expect(backend.list("/dir", { recursive: true })).rejects.toThrow(BackendFileNotFound);
    expect(errorHook).toHaveBeenCalledWith({
      op: "list",
      path: "/dir/nested/",
      error: expect.any(BackendFileNotFound),
    });
  });

  it("throws for forbidden list responses", async () => {
    mockFetch([
      ["GET", "https://ucdjs.dev/forbidden", () => new HttpResponse(null, { status: 403 })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.list("/forbidden")).rejects.toThrow("Failed to list directory");
  });

  it("checks existence via HEAD", async () => {
    mockFetch([
      ["HEAD", "https://ucdjs.dev/file.txt", () => new HttpResponse(null, { status: 200 })],
      ["HEAD", "https://ucdjs.dev/missing.txt", () => new HttpResponse(null, { status: 404 })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.exists("/file.txt")).resolves.toBe(true);
    await expect(backend.exists("/missing.txt")).resolves.toBe(false);
  });

  it("supports readBytes and stat", async () => {
    mockFetch([
      ["GET", "https://ucdjs.dev/file.bin", () =>
        new HttpResponse(new Uint8Array([1, 2, 3]), {
          status: 200,
        })],
      ["HEAD", "https://ucdjs.dev/file.bin", () =>
        new HttpResponse(null, {
          status: 200,
          headers: {
            [UCD_STAT_SIZE_HEADER]: "3",
            [UCD_STAT_TYPE_HEADER]: "file",
            "last-modified": "Tue, 17 Mar 2026 10:00:00 GMT",
          },
        })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.readBytes("/file.bin")).resolves.toEqual(new Uint8Array([1, 2, 3]));
    await expect(backend.stat("/file.bin")).resolves.toMatchObject({
      type: "file",
      size: 3,
    });
  });

  it("infers directory stat type from the metadata header", async () => {
    mockFetch([
      ["HEAD", "https://ucdjs.dev/dir", () =>
        new HttpResponse(null, {
          status: 200,
          headers: {
            [UCD_STAT_TYPE_HEADER]: "directory",
          },
        })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.stat("/dir")).resolves.toMatchObject({
      type: "directory",
      size: 0,
    });
  });

  it("ignores invalid last-modified values in stat responses", async () => {
    mockFetch([
      ["HEAD", "https://ucdjs.dev/file.txt", () =>
        new HttpResponse(null, {
          status: 200,
          headers: {
            [UCD_STAT_TYPE_HEADER]: "file",
            [UCD_STAT_SIZE_HEADER]: "3",
            "last-modified": "definitely-not-a-date",
          },
        })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.stat("/file.txt")).resolves.toEqual({
      type: "file",
      size: 3,
      mtime: undefined,
    });
  });

  it("is read-only and branded as the http backend", () => {
    const backend = HTTPFileSystemBackend({ baseUrl });

    expect(backend.features.size).toBe(0);
    expect(isHttpBackend(backend)).toBe(true);
    expect(isHttpBackend(NodeFileSystemBackend({ basePath: "/" }))).toBe(false);
  });
});
