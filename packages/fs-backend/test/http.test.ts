import type { BackendEntry } from "../src";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import HTTPFileSystemBackend from "../src/backends/http";
import NodeFileSystemBackend from "../src/backends/node";
import { BackendFileNotFound } from "../src/errors";
import { isHttpBackend } from "../src/guards";

describe("http backend", () => {
  const baseUrl = new URL("https://test.example.com/");

  it("reads file content successfully", async () => {
    mockFetch([
      ["GET", "https://test.example.com/file.txt", () =>
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
      ["GET", "https://test.example.com/file.txt", () =>
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
      ["GET", "https://test.example.com/file.txt", () =>
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
      { type: "file", name: "foo.txt", path: "/foo.txt", lastModified: Date.now() },
      { type: "directory", name: "nested", path: "/nested/", lastModified: Date.now() },
    ] satisfies Array<
      | { type: "file"; name: string; path: string; lastModified: number }
      | { type: "directory"; name: string; path: string; lastModified: number }
    >;

    mockFetch([
      ["GET", "https://test.example.com/", () => HttpResponse.json(entries)],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.list("/")).resolves.toEqual([
      { type: "file", name: "foo.txt", path: "/foo.txt" },
      { type: "directory", name: "nested", path: "/nested/", children: [] },
    ] satisfies BackendEntry[]);
  });

  it("lists recursively by following directory entries", async () => {
    mockFetch([
      ["GET", "https://test.example.com/dir", () => HttpResponse.json([
        { type: "file", name: "foo.txt", path: "/dir/foo.txt", lastModified: Date.now() },
        { type: "directory", name: "nested", path: "/dir/nested/", lastModified: Date.now() },
      ])],
      ["GET", "https://test.example.com/dir/nested", () => HttpResponse.json([
        { type: "file", name: "bar.txt", path: "/dir/nested/bar.txt", lastModified: Date.now() },
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

  it("returns an empty array for 404 and 403 list responses", async () => {
    mockFetch([
      ["GET", "https://test.example.com/missing", () => new HttpResponse(null, { status: 404 })],
      ["GET", "https://test.example.com/forbidden", () => new HttpResponse(null, { status: 403 })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.list("/missing")).resolves.toEqual([]);
    await expect(backend.list("/forbidden")).resolves.toEqual([]);
  });

  it("checks existence via HEAD", async () => {
    mockFetch([
      ["HEAD", "https://test.example.com/file.txt", () => new HttpResponse(null, { status: 200 })],
      ["HEAD", "https://test.example.com/missing.txt", () => new HttpResponse(null, { status: 404 })],
    ]);

    const backend = HTTPFileSystemBackend({ baseUrl });
    await expect(backend.exists("/file.txt")).resolves.toBe(true);
    await expect(backend.exists("/missing.txt")).resolves.toBe(false);
  });

  it("supports readBytes and stat", async () => {
    mockFetch([
      ["GET", "https://test.example.com/file.bin", () =>
        new HttpResponse(new Uint8Array([1, 2, 3]), {
          status: 200,
        })],
      ["HEAD", "https://test.example.com/file.bin", () =>
        new HttpResponse(null, {
          status: 200,
          headers: {
            "content-length": "3",
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

  it("is read-only and branded as the http backend", () => {
    const backend = HTTPFileSystemBackend({ baseUrl });

    expect(backend.features.size).toBe(0);
    expect(isHttpBackend(backend)).toBe(true);
    expect(isHttpBackend(NodeFileSystemBackend({ basePath: "/" }))).toBe(false);
  });
});
