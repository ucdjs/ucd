/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import { createDatabase } from "#db";
import { versions } from "#db/schema";
import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { executeRequest } from "../../helpers/request";

beforeEach(async () => {
  await env.UCD_DATA.exec("DROP TABLE IF EXISTS versions");
  await env.UCD_DATA.exec("CREATE TABLE versions (version TEXT PRIMARY KEY NOT NULL, major INTEGER NOT NULL, minor INTEGER NOT NULL, patch INTEGER NOT NULL, documentation_url TEXT NOT NULL, date TEXT, url TEXT NOT NULL, mapped_ucd_version TEXT, status TEXT NOT NULL, manifest_path TEXT, snapshot_path TEXT, file_count INTEGER, total_size INTEGER, published_at INTEGER, indexed_at INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);");
});

describe("v1_versions", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("GET /api/v1/versions", () => {
    it("returns supported versions from D1", async () => {
      const db = createDatabase(env.UCD_DATA);
      const now = new Date();

      await db.insert(versions).values([
        {
          version: "17.0.0",
          major: 17,
          minor: 0,
          patch: 0,
          documentationUrl: "https://www.unicode.org/versions/Unicode17.0.0/",
          date: null,
          url: "https://www.unicode.org/Public/17.0.0",
          mappedUcdVersion: null,
          status: "draft",
          indexedAt: now,
          createdAt: now,
          updatedAt: now,
        },
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
      ]);

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: true,
        cacheMaxAgePattern: /max-age=/,
      });

      await expect(json()).resolves.toEqual([
        {
          version: "17.0.0",
          documentationUrl: "https://www.unicode.org/versions/Unicode17.0.0/",
          date: null,
          url: "https://www.unicode.org/Public/17.0.0",
          mappedUcdVersion: null,
          type: "draft",
        },
        {
          version: "16.0.0",
          documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
          date: "2024",
          url: "https://www.unicode.org/Public/16.0.0",
          mappedUcdVersion: null,
          type: "stable",
        },
      ]);
    });

    it("returns an empty list when no supported versions exist", async () => {
      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions"),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: false,
      });

      await expect(json()).resolves.toEqual([]);
    });
  });
});
