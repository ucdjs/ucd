/// <reference types="../../../../../packages/test-utils/src/matchers/types.d.ts" />

import { createDatabase } from "#db";
import { versions } from "#db/schema";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeRequest } from "../../helpers/request";

const TASK_API_KEY = "b8539abb-f2e9-4f6f-86b3-36df26d752b4";

beforeEach(async () => {
  vi.restoreAllMocks();
  await env.UCD_DATA.exec("DROP TABLE IF EXISTS versions");
  await env.UCD_DATA.exec("CREATE TABLE versions (version TEXT PRIMARY KEY NOT NULL, major INTEGER NOT NULL, minor INTEGER NOT NULL, patch INTEGER NOT NULL, documentation_url TEXT NOT NULL, date TEXT, url TEXT NOT NULL, mapped_ucd_version TEXT, status TEXT NOT NULL, manifest_path TEXT, snapshot_path TEXT, file_count INTEGER, total_size INTEGER, published_at INTEGER, indexed_at INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);");

  env.UCDJS_TASK_API_KEY = {
    get: vi.fn().mockResolvedValue(TASK_API_KEY),
  };
});

describe("tasks", () => {
  // eslint-disable-next-line test/prefer-lowercase-title
  describe("POST /_tasks/reindex-versions", () => {
    it("should rebuild a D1 version row from Unicode metadata only", async () => {
      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/reindex-versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: JSON.stringify({
            versions: ["16.0.0"],
          }),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: false,
      });

      await expect(json()).resolves.toMatchObject({
        success: true,
        indexed: 1,
        skipped: 0,
        results: [
          {
            version: "16.0.0",
            indexed: true,
          },
        ],
      });

      const db = createDatabase(env.UCD_DATA);
      const [row] = await db.select().from(versions).where(eq(versions.version, "16.0.0")).limit(1);

      expect(row).toMatchObject({
        version: "16.0.0",
        status: "stable",
        fileCount: null,
        manifestPath: null,
        snapshotPath: null,
        documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
        url: "https://www.unicode.org/Public/16.0.0",
      });
    });

    it("should clear stale publish metadata when reindexing an existing row", async () => {
      const db = createDatabase(env.UCD_DATA);
      const seededAt = new Date("2026-04-15T00:00:00.000Z");

      await db.insert(versions).values({
        version: "16.0.0",
        major: 16,
        minor: 0,
        patch: 0,
        documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
        date: "2024-09-10",
        url: "https://www.unicode.org/Public/16.0.0",
        mappedUcdVersion: null,
        status: "stable",
        manifestPath: "16.0.0/manifest.json",
        snapshotPath: "16.0.0/snapshot.json",
        fileCount: 123,
        totalSize: 456,
        publishedAt: seededAt,
        indexedAt: seededAt,
        createdAt: seededAt,
        updatedAt: seededAt,
      });

      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/reindex-versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: JSON.stringify({
            versions: ["16.0.0"],
          }),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: false,
      });

      const [row] = await db.select().from(versions).where(eq(versions.version, "16.0.0")).limit(1);

      expect(row).toMatchObject({
        version: "16.0.0",
        manifestPath: null,
        snapshotPath: null,
        fileCount: null,
        totalSize: null,
        publishedAt: null,
      });
    });

    it("should reindex requested versions even when no manifest exists in R2", async () => {
      const { response, json } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/reindex-versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: JSON.stringify({
            versions: ["15.1.0"],
          }),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 200,
        json: true,
        cache: false,
      });

      await expect(json()).resolves.toMatchObject({
        success: true,
        indexed: 1,
        skipped: 0,
        results: [
          {
            version: "15.1.0",
            indexed: true,
          },
        ],
      });
    });

    it("should return 400 when the request body is invalid JSON", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/reindex-versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: "{",
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 400,
        error: {
          message: "Request body must be valid JSON",
        },
      });
    });

    it("should return 400 when a requested version is unsupported", async () => {
      const { response } = await executeRequest(
        new Request("https://api.ucdjs.dev/_tasks/reindex-versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-UCDJS-Task-Key": TASK_API_KEY,
          },
          body: JSON.stringify({
            versions: ["99.0.0"],
          }),
        }),
        env,
      );

      expect(response).toMatchResponse({
        status: 400,
        error: {
          message: "Invalid version format: 99.0.0. Expected format: X.Y.Z (e.g., 16.0.0)",
        },
      });
    });
  });
});
