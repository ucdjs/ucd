import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { HttpResponse, mockFetch } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { defineFileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createHTTPUCDStore, createNodeUCDStore, createUCDStore } from "../src/factory";
import { UCDStore } from "../src/store";

describe("store configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("createUCDStore configurations", () => {
    it("should create store with custom filesystem bridge", async () => {
      // Create a simple in-memory filesystem for testing
      const memoryFS = new Map<string, string>();

      const customFS = defineFileSystemBridge({
        capabilities: {
          read: true,
          write: true,
          listdir: false,
          mkdir: false,
          stat: false,
          exists: true,
          rm: false,
        },

        async read(path: string): Promise<string> {
          const content = memoryFS.get(path);
          if (content === undefined) {
            throw new Error(`File not found: ${path}`);
          }
          return content;
        },

        async write(path: string, data: string): Promise<void> {
          memoryFS.set(path, data);
        },

        async exists(path: string): Promise<boolean> {
          return memoryFS.has(path);
        },

        async listdir(): Promise<never> {
          throw new Error("listdir not supported");
        },

        async mkdir(): Promise<never> {
          throw new Error("mkdir not supported");
        },

        async stat(): Promise<never> {
          throw new Error("stat not supported");
        },

        async rm(): Promise<never> {
          throw new Error("rm not supported");
        },
      });

      // Initialize with empty manifest
      memoryFS.set("/test/.ucd-store.json", "[]");

      const store = await createUCDStore({
        basePath: "/test",
        fs: customFS,
      });

      expect(store).toBeInstanceOf(UCDStore);
      expect(store.basePath).toBe("/test");
      expect(store.fs).toBe(customFS);
    });

    it("should create store with custom base URL", async () => {
      const customBaseUrl = "https://custom.api.ucdjs.dev";

      const mockFS: FileSystemBridge = {
        capabilities: {
          read: true,
          write: false,
          listdir: false,
          mkdir: false,
          stat: false,
          exists: true,
          rm: false,
        },

        async read() {
          return "[]";
        },

        async exists() {
          return true;
        },

        async write(): Promise<never> {
          throw new Error("write not supported");
        },

        async listdir(): Promise<never> {
          throw new Error("listdir not supported");
        },

        async mkdir(): Promise<never> {
          throw new Error("mkdir not supported");
        },

        async stat(): Promise<never> {
          throw new Error("stat not supported");
        },

        async rm(): Promise<never> {
          throw new Error("rm not supported");
        },
      };

      const store = await createUCDStore({
        baseUrl: customBaseUrl,
        basePath: "/test",
        fs: mockFS,
      });

      expect(store.baseUrl).toBe(customBaseUrl);
      expect(store.basePath).toBe("/test");
    });

    it("should create store with global filters", async () => {
      const filters = ["*.txt", "!*test*"];

      const mockFS: FileSystemBridge = {
        capabilities: {
          read: true,
          write: false,
          listdir: false,
          mkdir: false,
          stat: false,
          exists: true,
          rm: false,
        },

        async read() {
          return "[]";
        },

        async exists() {
          return true;
        },

        async write(): Promise<never> {
          throw new Error("write not supported");
        },

        async listdir(): Promise<never> {
          throw new Error("listdir not supported");
        },

        async mkdir(): Promise<never> {
          throw new Error("mkdir not supported");
        },

        async stat(): Promise<never> {
          throw new Error("stat not supported");
        },

        async rm(): Promise<never> {
          throw new Error("rm not supported");
        },
      };

      const store = await createUCDStore({
        basePath: "/test",
        globalFilters: filters,
        fs: mockFS,
      });

      expect(store.filter).toBeDefined();
      expect(store.basePath).toBe("/test");
    });
  });

  describe("createNodeUCDStore configurations", () => {
    it("should create Node.js store with default options", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": "[]",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store).toBeInstanceOf(UCDStore);
      expect(store.basePath).toBe(storeDir);
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
      expect(store.fs.capabilities?.read).toBe(true);
      expect(store.fs.capabilities?.write).toBe(true);
      expect(store.fs.capabilities?.listdir).toBe(true);
      expect(store.fs.capabilities?.mkdir).toBe(true);
      expect(store.fs.capabilities?.stat).toBe(true);
      expect(store.fs.capabilities?.exists).toBe(true);
      expect(store.fs.capabilities?.rm).toBe(true);
    });

    it("should create Node.js store with custom base URL", async () => {
      const customBaseUrl = "https://custom.node.ucdjs.dev";
      const storeDir = await testdir({
        ".ucd-store.json": "[]",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
        baseUrl: customBaseUrl,
      });

      expect(store.baseUrl).toBe(customBaseUrl);
      expect(store.basePath).toBe(storeDir);
    });

    it("should create Node.js store with global filters", async () => {
      const filters = ["*.txt", "!*backup*"];
      const storeDir = await testdir({
        ".ucd-store.json": "[]",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
        globalFilters: filters,
      });

      expect(store.filter).toBeDefined();
      expect(store.basePath).toBe(storeDir);
    });
  });

  describe("createHTTPUCDStore configurations", () => {
    it("should create HTTP store with default options", async () => {
      const store = await createHTTPUCDStore();

      expect(store).toBeInstanceOf(UCDStore);
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
      expect(store.basePath).toBe("");
      expect(store.fs.capabilities?.read).toBe(true);
      expect(store.fs.capabilities?.write).toBe(false);
      expect(store.fs.capabilities?.listdir).toBe(true);
      expect(store.fs.capabilities?.mkdir).toBe(false);
      expect(store.fs.capabilities?.stat).toBe(true);
      expect(store.fs.capabilities?.exists).toBe(true);
      expect(store.fs.capabilities?.rm).toBe(false);
    });

    it("should create HTTP store with custom base URL", async () => {
      const customBaseUrl = "https://custom-http.ucdjs.dev";

      mockFetch([
        [["GET", "HEAD"], `${customBaseUrl}/.ucd-store.json`, () => {
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createHTTPUCDStore({
        baseUrl: customBaseUrl,
      });

      expect(store.baseUrl).toBe(customBaseUrl);
      expect(store.basePath).toBe("");
    });

    it("should create HTTP store with custom base path", async () => {
      const customBasePath = "/custom/api/path";

      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy${customBasePath}/.ucd-store.json`, () => {
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createHTTPUCDStore({
        basePath: customBasePath,
      });

      expect(store.basePath).toBe(customBasePath);
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
    });

    it("should create HTTP store with global filters", async () => {
      const filters = ["*.txt", "!*debug*"];

      const store = await createHTTPUCDStore({
        globalFilters: filters,
      });

      expect(store.filter).toBeDefined();
      expect(store.basePath).toBe("");
    });
  });

  describe("store capabilities configuration", () => {
    it("should infer capabilities from filesystem bridge", async () => {
      const readOnlyFS = defineFileSystemBridge({
        capabilities: {
          read: true,
          write: false,
          listdir: true,
          mkdir: false,
          stat: true,
          exists: true,
          rm: false,
        },

        async read() {
          return "[]";
        },

        async exists() {
          return true;
        },

        async listdir() {
          return [];
        },

        async stat() {
          return {
            isFile: () => true,
            isDirectory: () => false,
            mtime: new Date(),
            size: 0,
          };
        },

        async write(): Promise<never> {
          throw new Error("write not supported");
        },

        async mkdir(): Promise<never> {
          throw new Error("mkdir not supported");
        },

        async rm(): Promise<never> {
          throw new Error("rm not supported");
        },
      });

      const store = await createUCDStore({
        basePath: "/test",
        fs: readOnlyFS,
      });

      expect(store.capabilities.analyze).toBe(true);
      expect(store.capabilities.clean).toBe(false);
      expect(store.capabilities.mirror).toBe(false);
      expect(store.capabilities.repair).toBe(false);
    });

    it("should infer full capabilities from Node.js filesystem", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": "[]",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.capabilities.analyze).toBe(true);
      expect(store.capabilities.clean).toBe(true);
      expect(store.capabilities.mirror).toBe(true);
      expect(store.capabilities.repair).toBe(true);
    });

    it("should infer limited capabilities from HTTP filesystem", async () => {
      const store = await createHTTPUCDStore();

      expect(store.capabilities.analyze).toBe(true);
      expect(store.capabilities.clean).toBe(false);
      expect(store.capabilities.mirror).toBe(false);
      expect(store.capabilities.repair).toBe(false);
    });
  });

  describe("store initialization", () => {
    it("should initialize with existing manifest", async () => {
      const manifest = [
        { version: "15.0.0", path: "15.0.0" },
        { version: "15.1.0", path: "15.1.0" },
      ];

      const storeDir = await testdir({
        ".ucd-store.json": JSON.stringify(manifest),
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.versions).toEqual(["15.0.0", "15.1.0"]);
    });

    it("should initialize with empty manifest for new store", async () => {
      const storeDir = await testdir({});

      mockFetch([
        [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/unicode-versions`, () => {
          return HttpResponse.json([]);
        }],
      ]);

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.versions).toEqual([]);
    });

    it("should handle malformed manifest gracefully", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": "invalid json",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.versions).toEqual([]);
    });
  });

  describe("store client configuration", () => {
    it("should configure client with custom base URL", async () => {
      const customBaseUrl = "https://custom.client.ucdjs.dev";

      const mockFS: FileSystemBridge = {
        capabilities: {
          read: true,
          write: false,
          listdir: false,
          mkdir: false,
          stat: false,
          exists: true,
          rm: false,
        },

        async read() {
          return "[]";
        },

        async exists() {
          return true;
        },

        async write(): Promise<never> {
          throw new Error("write not supported");
        },

        async listdir(): Promise<never> {
          throw new Error("listdir not supported");
        },

        async mkdir(): Promise<never> {
          throw new Error("mkdir not supported");
        },

        async stat(): Promise<never> {
          throw new Error("stat not supported");
        },

        async rm(): Promise<never> {
          throw new Error("rm not supported");
        },
      };

      const store = await createUCDStore({
        baseUrl: customBaseUrl,
        basePath: "/test",
        fs: mockFS,
      });

      expect(store.client).toBeDefined();
      expect(store.baseUrl).toBe(customBaseUrl);
    });

    it("should use default base URL when not specified", async () => {
      const storeDir = await testdir({
        ".ucd-store.json": "[]",
      });

      const store = await createNodeUCDStore({
        basePath: storeDir,
      });

      expect(store.client).toBeDefined();
      expect(store.baseUrl).toBe(UCDJS_API_BASE_URL);
    });
  });
});
