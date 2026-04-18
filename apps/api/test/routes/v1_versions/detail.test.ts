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
  describe("GET /api/v1/versions/{version}", () => {
    it("returns a supported version from D1", async () => {
      const db = createDatabase(env.UCD_DATA);
      const now = new Date();

      await db.insert(versions).values({
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
      });

      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions/16.0.0"),
        env,
      );

      expect(response).toMatchResponse({
        json: true,
        status: 200,
      });

      await expect(json()).resolves.toMatchObject({
        version: "16.0.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
        date: "2024",
        url: "https://www.unicode.org/Public/16.0.0",
        mappedUcdVersion: null,
        type: "stable",
        statistics: {
          totalCharacters: 0,
          newCharacters: 0,
          totalBlocks: 0,
          newBlocks: 0,
          totalScripts: 0,
          newScripts: 0,
        },
      });
    });

    it("returns 404 when the version is not supported", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/api/v1/versions/16.0.0"),
        env,
      );

      expect(response).toMatchResponse({
        status: 404,
        error: {
          message: "Unicode version not found",
        },
      });
    });
  });
});
