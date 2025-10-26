import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { mockStoreApi } from "@ucdjs/test-utils";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../../../src/core/context";
import { createFilesNamespace } from "../../../src/operations/files/index";

describe("createFilesNamespace", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  describe("namespace creation", () => {
    it("should create files namespace with all operations", () => {
      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      expect(filesNamespace).toHaveProperty("get");
      expect(filesNamespace).toHaveProperty("list");
      expect(filesNamespace).toHaveProperty("tree");

      expect(typeof filesNamespace.get).toBe("function");
      expect(typeof filesNamespace.list).toBe("function");
      expect(typeof filesNamespace.tree).toBe("function");
    });

    it("should return object with correct structure", () => {
      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      // Should only have these three methods
      expect(Object.keys(filesNamespace).sort()).toEqual(["get", "list", "tree"]);
    });
  });

  describe("context binding", () => {
    it("should bind context to get operation", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "Test content",
        },
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      // Should be able to call get without passing context
      const [data, error] = await filesNamespace.get("16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should bind context to list operation", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      // Should be able to call list without passing context
      const [data, error] = await filesNamespace.list("16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should bind context to tree operation", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      // Should be able to call tree without passing context
      const [data, error] = await filesNamespace.tree("16.0.0");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("operation signatures", () => {
    it("should accept correct parameters for get operation", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "Content",
        },
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      // Should accept version, path, and optional options
      const [data1, error1] = await filesNamespace.get("16.0.0", "file.txt");
      expect(error1).toBeNull();
      expect(data1).toBeDefined();

      const [data2, error2] = await filesNamespace.get("16.0.0", "file.txt", {
        cache: false,
      });
      expect(error2).toBeNull();
      expect(data2).toBeDefined();

      const [data3, error3] = await filesNamespace.get("16.0.0", "file.txt", {
        filters: { include: ["**/*.txt"] },
      });
      expect(error3).toBeNull();
      expect(data3).toBeDefined();
    });

    it("should accept correct parameters for list operation", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      // Should accept version and optional options
      const [data1, error1] = await filesNamespace.list("16.0.0");
      expect(error1).toBeNull();
      expect(data1).toBeDefined();

      const [data2, error2] = await filesNamespace.list("16.0.0", {
        filters: { include: ["**/*.txt"] },
      });
      expect(error2).toBeNull();
      expect(data2).toBeDefined();
    });

    it("should accept correct parameters for tree operation", async () => {
      mockStoreApi({ versions: ["16.0.0"] });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      // Should accept version and optional options
      const [data1, error1] = await filesNamespace.tree("16.0.0");
      expect(error1).toBeNull();
      expect(data1).toBeDefined();

      const [data2, error2] = await filesNamespace.tree("16.0.0", {
        filters: { exclude: ["**/*.txt"] },
      });
      expect(error2).toBeNull();
      expect(data2).toBeDefined();
    });
  });

  describe("context isolation", () => {
    it("should use separate contexts for different namespace instances", async () => {
      mockStoreApi({ versions: ["16.0.0", "15.0.0"] });

      const filter1 = createPathFilter({ include: ["**/*.txt"] });
      const fs1 = createMemoryMockFS();
      const context1 = createInternalContext({
        client,
        filter: filter1,
        fs: fs1,
        basePath: "/test1",
        versions: ["16.0.0"],
        manifestPath: "/test1/.ucd-store.json",
      });

      const filter2 = createPathFilter({ include: ["**/*.json"] });
      const fs2 = createMemoryMockFS();
      const context2 = createInternalContext({
        client,
        filter: filter2,
        fs: fs2,
        basePath: "/test2",
        versions: ["15.0.0"],
        manifestPath: "/test2/.ucd-store.json",
      });

      const filesNamespace1 = createFilesNamespace(context1);
      const filesNamespace2 = createFilesNamespace(context2);

      // Each namespace should use its own context
      const [data1, error1] = await filesNamespace1.list("16.0.0");
      const [data2, error2] = await filesNamespace2.list("15.0.0");

      expect(error1).toBeNull();
      expect(error2).toBeNull();

      // Results should be different due to different filters
      // (assuming mock data contains both .txt and .json files)
      expect(data1).toBeDefined();
      expect(data2).toBeDefined();
    });

    it("should maintain context state across multiple operations", async () => {
      mockStoreApi({
        versions: ["16.0.0"],
        responses: {
          "/api/v1/files/{wildcard}": "Content",
        },
      });

      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      // Multiple operations should all use the same context
      const [listData, listError] = await filesNamespace.list("16.0.0");
      const [treeData, treeError] = await filesNamespace.tree("16.0.0");
      const [getData, getError] = await filesNamespace.get("16.0.0", "file.txt");

      expect(listError).toBeNull();
      expect(treeError).toBeNull();
      expect(getError).toBeNull();

      expect(listData).toBeDefined();
      expect(treeData).toBeDefined();
      expect(getData).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should handle empty versions in context", () => {
      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: [],
        manifestPath: "/test/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      expect(filesNamespace).toHaveProperty("get");
      expect(filesNamespace).toHaveProperty("list");
      expect(filesNamespace).toHaveProperty("tree");
    });

    it("should work with different base paths", () => {
      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/custom/path/to/store",
        versions: ["16.0.0"],
        manifestPath: "/custom/path/to/store/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      expect(filesNamespace).toBeDefined();
      expect(typeof filesNamespace.get).toBe("function");
      expect(typeof filesNamespace.list).toBe("function");
      expect(typeof filesNamespace.tree).toBe("function");
    });

    it("should work with multiple versions in context", () => {
      const filter = createPathFilter({});
      const fs = createMemoryMockFS();
      const context = createInternalContext({
        client,
        filter,
        fs,
        basePath: "/test",
        versions: ["16.0.0", "15.1.0", "15.0.0", "14.0.0"],
        manifestPath: "/test/.ucd-store.json",
      });

      const filesNamespace = createFilesNamespace(context);

      expect(filesNamespace).toBeDefined();
      expect(typeof filesNamespace.get).toBe("function");
      expect(typeof filesNamespace.list).toBe("function");
      expect(typeof filesNamespace.tree).toBe("function");
    });
  });
});
