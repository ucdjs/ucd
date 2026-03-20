import {
  BackendEntryIsDirectory,
  BackendEntryIsFile,
  BackendFileNotFound,
} from "@ucdjs/fs-backend";
import { describe, expect, it } from "vitest";
import { createMemoryMockFS } from "../../src/fs-backends/memory-fs-backend";
import { createReadOnlyBackend } from "../../src/fs-backends/read-only-backend";

describe("fs-backends", () => {
  describe("createReadOnlyBackend", () => {
    it("keeps default operations consistent with exists for missing files", async () => {
      const backend = createReadOnlyBackend({
        exists: async () => false,
      });

      await expect(backend.read("/missing.txt")).rejects.toThrow(BackendFileNotFound);
      await expect(backend.readBytes("/missing.txt")).rejects.toThrow(BackendFileNotFound);
      await expect(backend.stat("/missing.txt")).rejects.toThrow(BackendFileNotFound);
      await expect(backend.list("/missing/")).rejects.toThrow(BackendFileNotFound);
    });

    it("treats default list on a file path as an error", async () => {
      const backend = createReadOnlyBackend();

      await expect(backend.list("/file.txt")).rejects.toThrow(BackendEntryIsFile);
    });

    it("treats default read on a directory path as an error", async () => {
      const backend = createReadOnlyBackend();

      await expect(backend.read("/directory/")).rejects.toThrow(BackendEntryIsDirectory);
      await expect(backend.readBytes("/directory/")).rejects.toThrow(BackendEntryIsDirectory);
    });
  });

  describe("createMemoryMockFS", () => {
    it("rejects nested writes under a file", async () => {
      const backend = createMemoryMockFS({
        initialFiles: {
          foo: "content",
        },
      });

      await expect(backend.write("/foo/bar.txt", "content")).rejects.toThrow(BackendEntryIsFile);
    });

    it("rejects writing a file where a directory already exists", async () => {
      const backend = createMemoryMockFS({
        initialFiles: {
          "foo/bar.txt": "content",
        },
      });

      await expect(backend.write("/foo", "content")).rejects.toThrow(BackendEntryIsDirectory);
    });

    it("rejects creating a directory where a file already exists", async () => {
      const backend = createMemoryMockFS({
        initialFiles: {
          foo: "content",
        },
      });

      await expect(backend.mkdir("/foo/")).rejects.toThrow(BackendEntryIsFile);
    });

    it("rejects conflicting initial file and directory state", () => {
      expect(() => createMemoryMockFS({
        initialFiles: {
          "foo": "content",
          "foo/bar.txt": "nested",
        },
      })).toThrow(/Failed to setup file system backend/);
    });

    it("rejects directory copy into an existing file path", async () => {
      const backend = createMemoryMockFS({
        initialFiles: {
          "source/nested/file.txt": "content",
          "target/nested": "occupied",
        },
      });

      await expect(backend.copy("/source/", "/target/", { recursive: true })).rejects.toThrow(BackendEntryIsFile);
    });
  });
});
