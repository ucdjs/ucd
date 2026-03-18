import type { FileSystemBackend } from "../src";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCD_STAT_SIZE_HEADER, UCD_STAT_TYPE_HEADER } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import HTTPFileSystemBackend from "../src/backends/http";
import NodeFileSystemBackend from "../src/backends/node";
import { BackendEntryIsDirectory, BackendFileNotFound } from "../src/errors";

interface ReadonlyBackendHarness {
  name: string;
  createBackend: () => Promise<FileSystemBackend>;
}

const readonlyBackendHarnesses: ReadonlyBackendHarness[] = [
  {
    name: "node",
    async createBackend() {
      const dir = await testdir({
        "file.txt": "hello",
        "nested": {
          "child.txt": "world",
        },
      });

      return NodeFileSystemBackend({ basePath: dir });
    },
  },
  {
    name: "http",
    async createBackend() {
      const baseUrl = new URL("https://ucdjs.dev/");

      mockFetch([
        ["GET", "https://ucdjs.dev/file.txt", () =>
          new HttpResponse("hello", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          })],
        ["GET", "https://ucdjs.dev/", () => HttpResponse.json([
          { type: "directory", name: "nested", path: "/nested/" },
          { type: "file", name: "file.txt", path: "/file.txt" },
        ])],
        ["GET", "https://ucdjs.dev/nested", () => HttpResponse.json([
          { type: "file", name: "child.txt", path: "/nested/child.txt" },
        ])],
        ["GET", "https://ucdjs.dev/missing", () => new HttpResponse(null, { status: 404 })],
        ["GET", "https://ucdjs.dev/missing.txt", () => new HttpResponse(null, { status: 404 })],
        ["HEAD", "https://ucdjs.dev/file.txt", () =>
          new HttpResponse(null, {
            status: 200,
            headers: {
              [UCD_STAT_TYPE_HEADER]: "file",
              [UCD_STAT_SIZE_HEADER]: "5",
            },
          })],
        ["HEAD", "https://ucdjs.dev/nested", () =>
          new HttpResponse(null, {
            status: 200,
            headers: {
              [UCD_STAT_TYPE_HEADER]: "directory",
            },
          })],
        ["HEAD", "https://ucdjs.dev/missing.txt", () => new HttpResponse(null, { status: 404 })],
      ]);

      return HTTPFileSystemBackend({ baseUrl });
    },
  },
];

describe.each(readonlyBackendHarnesses)("read-only backend parity: $name", ({ createBackend }) => {
  it("reads file content", async () => {
    const backend = await createBackend();
    await expect(backend.read("/file.txt")).resolves.toBe("hello");
  });

  it("reads file bytes", async () => {
    const backend = await createBackend();
    await expect(backend.readBytes("/file.txt")).resolves.toEqual(new TextEncoder().encode("hello"));
  });

  it("throws BackendFileNotFound for missing files", async () => {
    const backend = await createBackend();
    await expect(backend.read("/missing.txt")).rejects.toThrow(BackendFileNotFound);
  });

  it("throws BackendEntryIsDirectory for directory-like read paths", async () => {
    const backend = await createBackend();
    await expect(backend.read("/nested/")).rejects.toThrow(BackendEntryIsDirectory);
  });

  it("lists entries non-recursively", async () => {
    const backend = await createBackend();
    await expect(backend.list("/")).resolves.toEqual([
      { type: "file", name: "file.txt", path: "/file.txt" },
      { type: "directory", name: "nested", path: "/nested/", children: [] },
    ]);
  });

  it("lists entries recursively", async () => {
    const backend = await createBackend();
    await expect(backend.list("/", { recursive: true })).resolves.toEqual([
      { type: "file", name: "file.txt", path: "/file.txt" },
      {
        type: "directory",
        name: "nested",
        path: "/nested/",
        children: [
          { type: "file", name: "child.txt", path: "/nested/child.txt" },
        ],
      },
    ]);
  });

  it("throws BackendFileNotFound when listing a missing path", async () => {
    const backend = await createBackend();
    await expect(backend.list("/missing/")).rejects.toThrow(BackendFileNotFound);
  });

  it("reports existence as a boolean only", async () => {
    const backend = await createBackend();
    await expect(backend.exists("/file.txt")).resolves.toBe(true);
    await expect(backend.exists("/missing.txt")).resolves.toBe(false);
  });

  it("returns file stat metadata", async () => {
    const backend = await createBackend();
    await expect(backend.stat("/file.txt")).resolves.toMatchObject({
      type: "file",
      size: 5,
    });
  });

  it("returns directory stat metadata", async () => {
    const backend = await createBackend();
    await expect(backend.stat("/nested")).resolves.toMatchObject({
      type: "directory",
    });
  });
});
