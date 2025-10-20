import { MOCK_TREE } from "#test-utils";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../../../src/errors";
import { createUCDStore } from "../../../src/store";

describe("file operations (node fs bridge)", () => {
  describe("get operations", () => {
    it("should fetch file from API successfully", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/16.0.0/UnicodeData.txt`, () => {
          return HttpResponse.text("0000;<control>;Cc;0;BN;;;;;N;NULL;;;;");
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [content, error] = await store.files.get("16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(content).toBe("0000;<control>;Cc;0;BN;;;;;N;NULL;;;;");
    });

    it("should fetch and cache file when FS supports write", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";
      let callCount = 0;

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/16.0.0/UnicodeData.txt`, () => {
          callCount += 1;
          return HttpResponse.text("test content");
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      await store.files.get("16.0.0", "UnicodeData.txt");

      const cached = await fs.read("/test/16.0.0/UnicodeData.txt");
      expect(cached).toBe("test content");

      expect(callCount).toBe(1);
    });

    it("should read from local FS when file exists", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      await fs.write!("/test/16.0.0/UnicodeData.txt", "cached content");

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [content, error] = await store.files.get("16.0.0", "UnicodeData.txt");

      expect(error).toBeNull();
      expect(content).toBe("cached content");
    });

    it("should disable caching with cache: false option", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/16.0.0/UnicodeData.txt`, () => {
          return HttpResponse.text("test content");
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      await store.files.get("16.0.0", "UnicodeData.txt", { cache: false });

      const exists = await fs.exists("/test/16.0.0/UnicodeData.txt");
      expect(exists).toBe(false);
    });

    it("should handle JSON response and stringify it", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/16.0.0/data.json`, () => {
          return HttpResponse.json({ version: "16.0.0", data: [1, 2, 3] });
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [content, error] = await store.files.get("16.0.0", "data.json");

      expect(error).toBeNull();
      expect(content).toContain("\"version\": \"16.0.0\"");
      expect(content).toContain("\"data\": [");
    });

    it("should reject invalid version", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [content, error] = await store.files.get("99.0.0", "UnicodeData.txt");

      expect(content).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toContain("99.0.0");
    });

    it("should reject file that doesn't pass filters", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [content, error] = await store.files.get("16.0.0", "UnicodeData.txt", {
        filters: { include: ["**/*.html"] },
      });

      expect(content).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("does not pass filters");
    });

    it("should handle API errors gracefully", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/16.0.0/Missing.txt`, () => {
          return new HttpResponse(null, { status: 404 });
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [content, error] = await store.files.get("16.0.0", "Missing.txt");

      expect(content).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("Failed to fetch file");
    });
  });

  describe("list operations", () => {
    it("should list all files for version (flattened paths)", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/16.0.0/tree`, () => {
          return HttpResponse.json(MOCK_TREE);
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [paths, error] = await store.files.list("16.0.0");

      expect(error).toBeNull();
      expect(paths).toEqual([
        "UnicodeData.txt",
        "extracted/DerivedAge.txt",
        "extracted/DerivedName.txt",
        "ReadMe.txt",
      ]);
    });

    it("should apply method-specific include filters", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/16.0.0/tree`, () => {
          return HttpResponse.json(MOCK_TREE);
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [paths, error] = await store.files.list("16.0.0", {
        filters: { include: ["extracted/**"] },
      });

      expect(error).toBeNull();
      expect(paths).toEqual([
        "extracted/DerivedAge.txt",
        "extracted/DerivedName.txt",
      ]);
    });

    it("should apply method-specific exclude filters", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/16.0.0/tree`, () => {
          return HttpResponse.json(MOCK_TREE);
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [paths, error] = await store.files.list("16.0.0", {
        filters: { exclude: ["extracted/**"] },
      });

      expect(error).toBeNull();
      expect(paths).toEqual([
        "UnicodeData.txt",
        "ReadMe.txt",
      ]);
    });

    it("should reject invalid version", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [paths, error] = await store.files.list("99.0.0");

      expect(paths).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toContain("99.0.0");
    });

    it("should handle API errors gracefully", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/16.0.0/tree`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [paths, error] = await store.files.list("16.0.0");

      expect(paths).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("Failed to fetch file tree");
    });
  });

  describe("tree operations", () => {
    it("should return full tree structure for version", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/16.0.0/file-tree`, () => {
          return HttpResponse.json(MOCK_TREE);
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [tree, error] = await store.files.tree("16.0.0");

      expect(error).toBeNull();
      expect(tree).toHaveLength(3);
      expect(tree?.[0]).toMatchObject({ name: "UnicodeData.txt", type: "file" });
      expect(tree?.[1]).toMatchObject({ name: "extracted", type: "directory" });
      expect(tree?.[1].children).toHaveLength(2);
    });

    it("should apply method-specific include filters", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/16.0.0/file-tree`, () => {
          return HttpResponse.json(MOCK_TREE);
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [tree, error] = await store.files.tree("16.0.0", {
        filters: { include: ["extracted/**"] },
      });

      expect(error).toBeNull();
      expect(tree).toHaveLength(1);
      expect(tree?.[0]).toMatchObject({ name: "extracted", type: "directory" });
      expect(tree?.[0].children).toHaveLength(2);
    });

    it("should apply method-specific exclude filters", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/16.0.0/file-tree`, () => {
          return HttpResponse.json(MOCK_TREE);
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [tree, error] = await store.files.tree("16.0.0", {
        filters: { exclude: ["extracted/**"] },
      });

      expect(error).toBeNull();
      expect(tree).toHaveLength(2);
      expect(tree?.[0]).toMatchObject({ name: "UnicodeData.txt", type: "file" });
      expect(tree?.[1]).toMatchObject({ name: "ReadMe.txt", type: "file" });
    });

    it("should reject invalid version", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [tree, error] = await store.files.tree("99.0.0");

      expect(tree).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreVersionNotFoundError);
      expect(error?.message).toContain("99.0.0");
    });

    it("should handle API errors gracefully", async () => {
      const fs = createMemoryMockFS();
      const basePath = "/test";

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json([{ version: "16.0.0" }]);
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/16.0.0/file-tree`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const store = await createUCDStore({
        fs,
        basePath,
        versions: ["16.0.0"],
        endpointConfig: getDefaultUCDEndpointConfig(),
      });

      const [tree, error] = await store.files.tree("16.0.0");

      expect(tree).toBeNull();
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error?.message).toContain("Failed to fetch file tree");
    });
  });
});
