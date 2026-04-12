/// <reference types="../../../../packages/test-utils/src/matchers/types.d.ts" />

import { createDatabase } from "#db";
import { versions } from "#db/schema";
import { UCDWellKnownConfigSchema } from "@ucdjs/schemas";
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeRequest } from "../helpers/request";

beforeEach(async () => {
  await env.UCD_DATA.exec("DROP TABLE IF EXISTS versions");
  await env.UCD_DATA.exec("CREATE TABLE versions (version TEXT PRIMARY KEY NOT NULL, major INTEGER NOT NULL, minor INTEGER NOT NULL, patch INTEGER NOT NULL, documentation_url TEXT NOT NULL, date TEXT, url TEXT NOT NULL, mapped_ucd_version TEXT, status TEXT NOT NULL, manifest_path TEXT, snapshot_path TEXT, file_count INTEGER, total_size INTEGER, published_at INTEGER, indexed_at INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);");
});

describe("well-known", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /ucd-config.json", () => {
    it("should return UCD config successfully with versions array", async () => {
      const db = createDatabase(env.UCD_DATA);
      const now = new Date();

      await db.insert(versions).values([
        {
          version: "16.0.0",
          major: 16,
          minor: 0,
          patch: 0,
          documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
          date: "2024",
          url: "https://www.unicode.org/Public/16.0.0",
          mappedUcdVersion: null,
          status: "stable",
          indexedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          version: "15.1.0",
          major: 15,
          minor: 1,
          patch: 0,
          documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
          date: "2023",
          url: "https://www.unicode.org/Public/15.1.0",
          mappedUcdVersion: null,
          status: "stable",
          indexedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-config.json"),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
      });

      const data = await json();

      expect(data).toMatchSchema({
        success: true,
        schema: UCDWellKnownConfigSchema,
        data: {
          versions: ["16.0.0", "15.1.0"],
        },
      });
    });
  });

  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /ucd-store/{version}.json", () => {
    it("should return manifest for specific version", async () => {
      const mockManifest = {
        expectedFiles: [
          "16.0.0/ucd/UnicodeData.txt",
          "16.0.0/ucd/PropList.txt",
        ],
      };

      const mockGet = vi.fn().mockResolvedValue({
        json: async () => mockManifest,
        uploaded: new Date("2024-01-01"),
        httpEtag: "\"abc123etag\"",
      });

      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          get: mockGet,
        } as any,
      };

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-store/16.0.0.json"),
        mockEnv,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
        headers: {
          "ETag": "\"abc123etag\"",
          "Last-Modified": /.+/,
        },
      });

      const data = await json();
      expect(data).toEqual(mockManifest);
      expect(mockGet).toHaveBeenCalledWith("manifest/16.0.0/manifest.json");
    });

    it("should return matching ETag for HEAD and GET", async () => {
      const mockManifest = {
        expectedFiles: [
          "16.0.0/ucd/UnicodeData.txt",
          "16.0.0/ucd/PropList.txt",
        ],
      };

      const mockGet = vi.fn().mockResolvedValue({
        json: async () => mockManifest,
        uploaded: new Date("2024-01-01"),
        httpEtag: "\"same-etag\"",
      });

      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          get: mockGet,
        } as any,
      };

      const { response: getResponse } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-store/16.0.0.json"),
        mockEnv,
      );

      const { response: headResponse, text } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-store/16.0.0.json", {
          method: "HEAD",
        }),
        mockEnv,
      );

      expect(getResponse).toMatchResponse({
        status: 200,
        json: true,
        headers: {
          ETag: /.+/,
        },
      });

      expect(headResponse).toMatchResponse({
        status: 200,
        headers: {
          ETag: /.+/,
        },
      });

      const getEtag = getResponse.headers.get("ETag");
      const headEtag = headResponse.headers.get("ETag");
      expect(getEtag).toBeTruthy();
      expect(headEtag).toBe(getEtag);

      expect(await text()).toBe("");
    });

    it("should return 404 for non-existent version", async () => {
      const mockGet = vi.fn().mockResolvedValue(null);

      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          get: mockGet,
        } as any,
      };

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-store/99.0.0.json"),
        mockEnv,
      );

      expect(response).toMatchResponse({
        status: 404,
      });
    });

    it("should return 404 for invalid version format", async () => {
      const mockEnv = {
        ...env,
        UCD_BUCKET: {
          get: vi.fn(),
        } as any,
      };

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/.well-known/ucd-store/invalid.json"),
        mockEnv,
      );

      expect(response).toMatchResponse({
        status: 404,
        json: true,
        error: {
          message: /Invalid version format: invalid\. Expected format: X\.Y\.Z \(e\.g\., 16\.0\.0\)/,
        },
      });
    });
  });
});
