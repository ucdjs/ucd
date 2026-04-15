import type { HonoEnv } from "#types";
import { createDatabase } from "#db";
import { versions } from "#db/schema";
import { isValidUnicodeVersion } from "@ucdjs-internal/shared";
import {
  badGateway,
  badRequest,
  clearCacheEntry,
} from "@ucdjs-internal/worker-utils";
import {
  resolveUCDVersion,
  UNICODE_VERSION_METADATA,
} from "@unicode-utils/core";
import { Hono } from "hono";
import {
  V1_VERSIONS_DETAIL_CACHE_NAME,
  V1_VERSIONS_LIST_CACHE_NAME,
  V1_VERSIONS_ROUTER_BASE_PATH,
  WELL_KNOWN_ROUTER_BASE_PATH,
  WELL_KNOWN_UCD_CONFIG_CACHE_NAME,
} from "../../constants";

export const TASK_REINDEX_ROUTER = new Hono<HonoEnv>();

TASK_REINDEX_ROUTER.post("/reindex-versions", async (c) => {
  let body: { versions?: string[] } = {};
  const contentLength = c.req.header("Content-Length");
  const contentType = c.req.header("Content-Type");
  const hasBody = (contentLength != null && Number(contentLength) > 0)
    || (contentType != null && contentType.includes("application/json"));

  if (hasBody) {
    try {
      body = await c.req.json<{ versions?: string[] }>();
    } catch {
      return badRequest(c, { message: "Request body must be valid JSON" });
    }
  }

  if (body.versions != null && !Array.isArray(body.versions)) {
    return badRequest(c, { message: "Request body field 'versions' must be an array of version strings" });
  }

  const requestedVersions = body.versions?.map((version) => version.trim()).filter(Boolean);
  if (requestedVersions) {
    const invalidVersion = requestedVersions.find((version) => !isValidUnicodeVersion(version));
    if (invalidVersion) {
      return badRequest(c, { message: `Invalid version format: ${invalidVersion}. Expected format: X.Y.Z (e.g., 16.0.0)` });
    }
  }

  const availableMetadata = new Map(
    UNICODE_VERSION_METADATA.map((version) => [version.version, version] as const),
  );
  const versionsToIndex = requestedVersions ?? [...availableMetadata.keys()];
  const missingMetadata = versionsToIndex.filter((version) => !availableMetadata.has(version));
  if (missingMetadata.length > 0) {
    return badRequest(c, {
      message: `Unsupported reindex version(s): ${missingMetadata.join(", ")}. Update @unicode-utils/core metadata first.`,
    });
  }

  try {
    const db = createDatabase(c.env.UCD_DATA);
    const results: Array<{ version: string; indexed: true }> = [];

    for (const version of versionsToIndex) {
      const metadata = availableMetadata.get(version)!;
      const [major = 0, minor = 0, patch = 0] = version.split(".").map((part) => Number.parseInt(part, 10) || 0);
      const mappedUcdVersion = resolveUCDVersion(version);
      const now = new Date();

      await db
        .insert(versions)
        .values({
          version,
          major,
          minor,
          patch,
          documentationUrl: `https://www.unicode.org/versions/Unicode${version}/`,
          date: metadata.date ?? null,
          url: `https://www.unicode.org/Public/${mappedUcdVersion}`,
          mappedUcdVersion: mappedUcdVersion === version ? null : mappedUcdVersion,
          status: metadata.type,
          manifestPath: null,
          snapshotPath: null,
          fileCount: null,
          totalSize: null,
          publishedAt: null,
          indexedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: versions.version,
          set: {
            major,
            minor,
            patch,
            documentationUrl: `https://www.unicode.org/versions/Unicode${version}/`,
            date: metadata.date ?? null,
            url: `https://www.unicode.org/Public/${mappedUcdVersion}`,
            mappedUcdVersion: mappedUcdVersion === version ? null : mappedUcdVersion,
            status: metadata.type,
            manifestPath: null,
            snapshotPath: null,
            fileCount: null,
            totalSize: null,
            publishedAt: null,
            indexedAt: now,
            updatedAt: now,
          },
        });

      results.push({
        version,
        indexed: true,
      });
    }

    const origin = new URL(c.req.url).origin;
    const purgeTargets = [
      {
        cacheName: V1_VERSIONS_LIST_CACHE_NAME,
        path: V1_VERSIONS_ROUTER_BASE_PATH,
      },
      {
        cacheName: WELL_KNOWN_UCD_CONFIG_CACHE_NAME,
        path: `${WELL_KNOWN_ROUTER_BASE_PATH}/ucd-config.json`,
      },
      {
        cacheName: V1_VERSIONS_DETAIL_CACHE_NAME,
        path: `${V1_VERSIONS_ROUTER_BASE_PATH}/latest`,
      },
      ...versionsToIndex.map((version) => ({
        cacheName: V1_VERSIONS_DETAIL_CACHE_NAME,
        path: `${V1_VERSIONS_ROUTER_BASE_PATH}/${version}`,
      })),
    ];

    await Promise.all(purgeTargets.map(async ({ cacheName, path }) => {
      const clearCache = await clearCacheEntry(cacheName);
      await clearCache(`${origin}${path}`);
    }));

    const indexed = results.filter((result) => result.indexed);

    return c.json({
      success: true,
      indexed: indexed.length,
      skipped: 0,
      results,
    }, 200);
  } catch (err) {
    console.error("[tasks]: failed to reindex versions:", err);
    // eslint-disable-next-line e18e/prefer-static-regex
    if (err instanceof Error && /no such table:\s*versions/i.test(err.message)) {
      return badGateway(c, {
        message: "Missing D1 schema for the versions table. Apply API D1 migrations before reindexing.",
      });
    }

    return badGateway(c);
  }
});
