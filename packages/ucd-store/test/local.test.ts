import type { UCDStoreRootSchema, UCDStoreVersionSchema } from "../src/local";
import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { LocalUCDStore } from "../src/local";

describe("localUCDStore", () => {
  let storePath: string;

  describe("constructor", () => {
    it("should create instance with default options", () => {
      const store = new LocalUCDStore();

      expect(store.baseUrl).toBe("https://unicode-api.luxass.dev/api/v1");
      expect(store.proxyUrl).toBe("https://unicode-proxy.ucdjs.dev");
      expect(store.filters).toEqual([]);
      expect(store.basePath).toBe(path.resolve("./ucd-files"));
    });

    it("should create instance with custom options", async () => {
      storePath = await testdir({});

      const store = new LocalUCDStore({
        baseUrl: "https://custom-api.example.com",
        proxyUrl: "https://custom-proxy.example.com",
        filters: ["filter1", "filter2"],
        basePath: storePath,
      });

      expect(store.baseUrl).toBe("https://custom-api.example.com");
      expect(store.proxyUrl).toBe("https://custom-proxy.example.com");
      expect(store.filters).toEqual(["filter1", "filter2"]);
      expect(store.basePath).toBe(storePath);
    });

    it("should resolve relative basePath", () => {
      const store = new LocalUCDStore({
        basePath: "./relative-path",
      });

      expect(store.basePath).toBe(path.resolve("./relative-path"));
    });
  });

  describe("bootstrap", () => {
    it("should create new store when directory doesn't exist", async () => {
      storePath = await testdir({});
      const store = new LocalUCDStore({ basePath: storePath });

      await store.bootstrap();

      // Check that manifest file was created
      const manifestPath = path.join(storePath, ".ucd-store.json");
      expect(await fs.readFile(manifestPath, "utf8")).toBeDefined();

      // Check versions array is empty
      expect(store.versions).toEqual([]);
    });

    it("should load existing store", async () => {
      // Create a pre-existing store structure
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [
            { version: "15.0.0", path: "15.0.0" },
            { version: "16.0.0", path: "16.0.0" },
          ],
        }, null, 2),
        "15.0.0/.ucd-version.json": JSON.stringify({
          version: "15.0.0",
          files: ["UnicodeData.txt", "Blocks.txt"],
        }, null, 2),
        "15.0.0/UnicodeData.txt": "Mock content for UnicodeData.txt in version 15.0.0",
        "15.0.0/Blocks.txt": "Mock content for Blocks.txt in version 15.0.0",
        "16.0.0/.ucd-version.json": JSON.stringify({
          version: "16.0.0",
          files: ["UnicodeData.txt", "Blocks.txt", "Scripts.txt"],
        }, null, 2),
        "16.0.0/UnicodeData.txt": "Mock content for UnicodeData.txt in version 16.0.0",
        "16.0.0/Blocks.txt": "Mock content for Blocks.txt in version 16.0.0",
        "16.0.0/Scripts.txt": "Mock content for Scripts.txt in version 16.0.0",
      });

      const store = new LocalUCDStore({ basePath: storePath });
      await store.bootstrap();

      expect(store.versions).toEqual(["15.0.0", "16.0.0"]);
    });

    it("should throw error if basePath is not set", async () => {
      const store = new LocalUCDStore({ basePath: "" });

      await expect(store.bootstrap()).rejects.toThrow("Base path is required for LocalUCDStore.");
    });
  });

  describe("store validation", () => {
    it("should throw error if .ucd-store.json is missing", async () => {
      // Create directory without manifest
      storePath = await testdir({
        "some-file.txt": "content",
      });

      const store = new LocalUCDStore({ basePath: storePath });

      await expect(store.bootstrap()).rejects.toThrow(
        `Invalid UCD store: Missing .ucd-store.json file at ${storePath}`,
      );
    });

    it("should throw error if .ucd-store.json has invalid JSON", async () => {
      storePath = await testdir({
        ".ucd-store.json": "invalid json",
      });

      const store = new LocalUCDStore({ basePath: storePath });

      await expect(store.bootstrap()).rejects.toThrow(
        "Invalid UCD store: .ucd-store.json contains invalid JSON",
      );
    });

    it("should throw error if .ucd-store.json has invalid schema", async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: "not a boolean",
          versions: "not an array",
        }),
      });

      const store = new LocalUCDStore({ basePath: storePath });

      await expect(store.bootstrap()).rejects.toThrow("Invalid UCD store manifest:");
    });

    it("should throw error if version directory is missing", async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [{ version: "15.0.0", path: "15.0.0" }],
        }),
      });

      const store = new LocalUCDStore({ basePath: storePath });

      await expect(store.bootstrap()).rejects.toThrow(
        "Invalid UCD store: Version directory '15.0.0' does not exist",
      );
    });

    it("should throw error if version path is not a directory", async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [{ version: "15.0.0", path: "15.0.0" }],
        }),
        "15.0.0": "not a directory", // File instead of directory
      });

      const store = new LocalUCDStore({ basePath: storePath });

      await expect(store.bootstrap()).rejects.toThrow(
        "Invalid UCD store: Version path '15.0.0' exists but is not a directory",
      );
    });

    it("should throw error if version manifest is missing", async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [{ version: "15.0.0", path: "15.0.0" }],
        }),
        "15.0.0/dummy.txt": "content", // Directory without manifest
      });

      const store = new LocalUCDStore({ basePath: storePath });

      await expect(store.bootstrap()).rejects.toThrow(
        "Invalid UCD store: Version manifest missing for '15.0.0'",
      );
    });

    it("should throw error if version manifest has invalid JSON", async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [{ version: "15.0.0", path: "15.0.0" }],
        }),
        "15.0.0/.ucd-version.json": "invalid json",
      });

      const store = new LocalUCDStore({ basePath: storePath });

      await expect(store.bootstrap()).rejects.toThrow(
        "Invalid version manifest: .ucd-version.json contains invalid JSON for version '15.0.0'",
      );
    });

    it("should throw error if version manifest has invalid schema", async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [{ version: "15.0.0", path: "15.0.0" }],
        }),
        "15.0.0/.ucd-version.json": JSON.stringify({
          version: 123, // should be string
          files: "not an array",
        }),
      });

      const store = new LocalUCDStore({ basePath: storePath });

      await expect(store.bootstrap()).rejects.toThrow("Invalid version manifest:");
    });

    it("should throw error if version mismatch in manifest", async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [{ version: "15.0.0", path: "15.0.0" }],
        }),
        "15.0.0/.ucd-version.json": JSON.stringify({
          version: "16.0.0", // different from expected
          files: [],
        }),
      });

      const store = new LocalUCDStore({ basePath: storePath });

      await expect(store.bootstrap()).rejects.toThrow(
        "Invalid version manifest: version mismatch. Expected '15.0.0', got '16.0.0'",
      );
    });

    it("should throw error if expected file is missing", async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [{ version: "15.0.0", path: "15.0.0" }],
        }),
        "15.0.0/.ucd-version.json": JSON.stringify({
          version: "15.0.0",
          files: ["UnicodeData.txt"], // file doesn't exist
        }),
      });

      const store = new LocalUCDStore({ basePath: storePath });

      await expect(store.bootstrap()).rejects.toThrow(
        "Missing file: UnicodeData.txt not found",
      );
    });

    it("should throw error if expected file is not a file", async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [{ version: "15.0.0", path: "15.0.0" }],
        }),
        "15.0.0/.ucd-version.json": JSON.stringify({
          version: "15.0.0",
          files: ["UnicodeData.txt"],
        }),
        "15.0.0/UnicodeData.txt/nested.txt": "content", // Directory instead of file
      });

      const store = new LocalUCDStore({ basePath: storePath });

      await expect(store.bootstrap()).rejects.toThrow(
        "Invalid file: UnicodeData.txt exists but is not a file",
      );
    });
  });

  describe("versions property", () => {
    beforeEach(async () => {
      storePath = await testdir({});
    });

    it("should return empty array for new store", async () => {
      const store = new LocalUCDStore({ basePath: storePath });
      await store.bootstrap();

      expect(store.versions).toEqual([]);
    });

    it("should return versions from manifest", async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [
            { version: "16.0.0", path: "16.0.0" },
            { version: "15.0.0", path: "15.0.0" },
            { version: "14.0.0", path: "14.0.0" },
          ],
        }),
        "16.0.0/.ucd-version.json": JSON.stringify({ version: "16.0.0", files: [] }),
        "15.0.0/.ucd-version.json": JSON.stringify({ version: "15.0.0", files: [] }),
        "14.0.0/.ucd-version.json": JSON.stringify({ version: "14.0.0", files: [] }),
      });

      const store = new LocalUCDStore({ basePath: storePath });
      await store.bootstrap();

      expect(store.versions).toEqual(["16.0.0", "15.0.0", "14.0.0"]);
    });

    it("should return a copy of versions array", async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [{ version: "15.0.0", path: "15.0.0" }],
        }),
        "15.0.0/.ucd-version.json": JSON.stringify({ version: "15.0.0", files: [] }),
      });

      const store = new LocalUCDStore({ basePath: storePath });
      await store.bootstrap();

      const versions1 = store.versions;
      const versions2 = store.versions;

      expect(versions1).toEqual(versions2);
      expect(versions1).not.toBe(versions2); // Different references
    });
  });

  describe("implemented methods", () => {
    let store: LocalUCDStore;

    beforeEach(async () => {
      storePath = await testdir({
        ".ucd-store.json": JSON.stringify({
          root: true,
          versions: [
            { version: "15.0.0", path: "15.0.0" },
            { version: "16.0.0", path: "16.0.0" },
          ],
        }),
        "15.0.0/.ucd-version.json": JSON.stringify({
          version: "15.0.0",
          files: ["UnicodeData.txt", "Blocks.txt"],
        }),
        "15.0.0/UnicodeData.txt": "Mock UnicodeData content",
        "15.0.0/Blocks.txt": "Mock Blocks content",
        "16.0.0/.ucd-version.json": JSON.stringify({
          version: "16.0.0",
          files: ["UnicodeData.txt", "Scripts.txt"],
        }),
        "16.0.0/UnicodeData.txt": "Mock UnicodeData v16 content",
        "16.0.0/Scripts.txt": "Mock Scripts content",
      });

      store = new LocalUCDStore({ basePath: storePath });
      await store.bootstrap();
    });

    describe("hasVersion", () => {
      it("should return true for existing version", () => {
        expect(store.hasVersion("15.0.0")).toBe(true);
        expect(store.hasVersion("16.0.0")).toBe(true);
      });

      it("should return false for non-existing version", () => {
        expect(store.hasVersion("17.0.0")).toBe(false);
        expect(store.hasVersion("invalid")).toBe(false);
      });
    });

    describe("getFilePaths", () => {
      it("should return file paths for existing version", async () => {
        const paths = await store.getFilePaths("15.0.0");
        expect(paths).toEqual(["UnicodeData.txt", "Blocks.txt"]);
      });

      it("should return different file paths for different versions", async () => {
        const paths16 = await store.getFilePaths("16.0.0");
        expect(paths16).toEqual(["UnicodeData.txt", "Scripts.txt"]);
      });

      it("should throw error for non-existing version", async () => {
        await expect(store.getFilePaths("17.0.0")).rejects.toThrow(
          "Version '17.0.0' not found in store",
        );
      });
    });

    describe("getFile", () => {
      it("should return file content for existing file", async () => {
        const content = await store.getFile("15.0.0", "UnicodeData.txt");
        expect(content).toBe("Mock UnicodeData content");
      });

      it("should return different content for different versions", async () => {
        const content15 = await store.getFile("15.0.0", "UnicodeData.txt");
        const content16 = await store.getFile("16.0.0", "UnicodeData.txt");

        expect(content15).toBe("Mock UnicodeData content");
        expect(content16).toBe("Mock UnicodeData v16 content");
      });

      it("should throw error for non-existing version", async () => {
        await expect(store.getFile("17.0.0", "UnicodeData.txt")).rejects.toThrow(
          "Version '17.0.0' not found in store",
        );
      });

      it("should throw error for non-existing file", async () => {
        await expect(store.getFile("15.0.0", "NonExistent.txt")).rejects.toThrow(
          "File 'NonExistent.txt' not found in version '15.0.0'",
        );
      });
    });

    describe("getFileTree", () => {
      it("should return file tree for existing version", async () => {
        const tree = await store.getFileTree("15.0.0");

        expect(tree).toHaveLength(2);
        expect(tree).toEqual([
          { name: "UnicodeData.txt", path: "UnicodeData.txt" },
          { name: "Blocks.txt", path: "Blocks.txt" },
        ]);
      });

      it("should return different file tree for different versions", async () => {
        const tree16 = await store.getFileTree("16.0.0");

        expect(tree16).toHaveLength(2);
        expect(tree16).toEqual([
          { name: "UnicodeData.txt", path: "UnicodeData.txt" },
          { name: "Scripts.txt", path: "Scripts.txt" },
        ]);
      });

      it("should throw error for non-existing version", async () => {
        await expect(store.getFileTree("17.0.0")).rejects.toThrow(
          "Version '17.0.0' not found in store",
        );
      });
    });
  });
});
