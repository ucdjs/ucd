import type { UnicodeVersion } from "@ucdjs/schemas";
import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getCurrentDraftVersion,
  hasUCDFolderPath,
  resolveUCDVersion,
  UNICODE_STABLE_VERSION,
  UNICODE_VERSION_METADATA,
} from "@unicode-utils/core";
import { traverse } from "apache-autoindex-parse/traverse";
import { V1_VERSIONS_ROUTER_BASE_PATH } from "../../constants";
import { badRequest, internalServerError, notFound } from "../../lib/errors";
import { createLogger } from "../../lib/logger";
import {
  GET_VERSION_FILE_TREE_ROUTE,
  GET_VERSION_ROUTE,
  LIST_ALL_UNICODE_VERSIONS_ROUTE,
} from "./openapi";

export const V1_VERSIONS_ROUTER = new OpenAPIHono<HonoEnv>().basePath(V1_VERSIONS_ROUTER_BASE_PATH);

const log = createLogger("ucd:api:v1_versions");

V1_VERSIONS_ROUTER.openapi(LIST_ALL_UNICODE_VERSIONS_ROUTE, async (c) => {
  try {
    const controller = new AbortController();

    const response = await fetch("https://www.unicode.org/versions/enumeratedversions.html", {
      signal: controller.signal,
    });

    log.info("Fetching unicode html versions page");

    setTimeout(() => {
      controller.abort();
      log.warn("Fetching unicode versions page timed out");
    }, 7000);

    if (!response.ok) {
      log.error("Failed to fetch Unicode versions page", { status: response.status, statusText: response.statusText });
      return internalServerError(c, {
        message: "Failed to fetch Unicode versions",
      });
    }

    log.info("Successfully fetched Unicode versions page", { status: response.status });
    const html = await response.text();

    // find any table that contains Unicode version information
    const versionPattern = /Unicode \d+\.\d+\.\d+/;
    const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/g)?.find((table) =>
      versionPattern.test(table),
    );

    log.debug("Table Match", !!tableMatch);

    if (!tableMatch) {
      return notFound(c, {
        message: "Unicode versions table not found",
      });
    }

    const draft = await getCurrentDraftVersion().catch(() => null);

    const versions: UnicodeVersion[] = [];

    // match any row that contains a cell
    const rows = tableMatch.match(/<tr>[\s\S]*?<\/tr>/g) || [];
    log.debug("Found rows in table", rows.length);

    for (const row of rows) {
      // look for Unicode version pattern in the row
      const versionMatch = row.match(new RegExp(`<a[^>]+href="([^"]+)"[^>]*>\\s*(${versionPattern.source})\\s*</a>`));
      if (!versionMatch) {
        log.debug("No version match in row", row);
        continue;
      }

      const documentationUrl = versionMatch[1];
      const version = versionMatch[2]!.replace("Unicode ", "");

      // look for a year pattern anywhere in the row
      const dateMatch = row.match(/<td[^>]*>(\d{4})<\/td>/);
      if (!dateMatch) continue;
      const ucdVersion = resolveUCDVersion(version);
      const publicUrl = `https://www.unicode.org/Public/${ucdVersion}`;

      versions.unshift({
        version,
        documentationUrl: documentationUrl!,
        date: dateMatch[1]!,
        url: publicUrl,
        mappedUcdVersion: ucdVersion === version ? null : ucdVersion,
        type: draft === version ? "draft" : "stable",
      });
    }

    if (draft != null && !versions.some((v) => v.type === "draft")) {
      const draftUcdVersion = resolveUCDVersion(draft);
      versions.push({
        version: draft,
        documentationUrl: `https://www.unicode.org/versions/Unicode${draft}/`,
        date: null,
        url: `https://www.unicode.org/Public/${draft}`,
        mappedUcdVersion: draftUcdVersion === draft ? null : draftUcdVersion,
        type: "draft",
      });
    }

    if (versions.length === 0) {
      return notFound(c, {
        message: "No Unicode versions found",
      });
    }

    // sort versions by their major, minor, and patch numbers in from newest to oldest order
    versions.sort((a, b) => {
      const [majorA = 0, minorA = 0, patchA = 0] = a.version.split(".").map(Number);
      const [majorB = 0, minorB = 0, patchB = 0] = b.version.split(".").map(Number);

      if (majorA !== majorB) return majorB - majorA;
      if (minorA !== minorB) return minorB - minorA;
      return patchB - patchA;
    });

    return c.json(versions, 200);
  } catch (err) {
    console.error("Error fetching Unicode versions:", err);
    return internalServerError(c);
  }
});

async function getVersionFromList(version: string): Promise<UnicodeVersion | null> {
  try {
    const controller = new AbortController();
    const response = await fetch("https://www.unicode.org/versions/enumeratedversions.html", {
      signal: controller.signal,
    });

    setTimeout(() => {
      controller.abort();
    }, 7000);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const versionPattern = /Unicode \d+\.\d+\.\d+/;
    const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/g)?.find((table) =>
      versionPattern.test(table),
    );

    if (!tableMatch) {
      return null;
    }

    const draft = await getCurrentDraftVersion().catch(() => null);
    const rows = tableMatch.match(/<tr>[\s\S]*?<\/tr>/g) || [];

    for (const row of rows) {
      const versionMatch = row.match(new RegExp(`<a[^>]+href="([^"]+)"[^>]*>\\s*(${versionPattern.source})\\s*</a>`));
      if (!versionMatch) continue;

      const documentationUrl = versionMatch[1];
      const foundVersion = versionMatch[2]!.replace("Unicode ", "");

      if (foundVersion !== version) continue;

      const dateMatch = row.match(/<td[^>]*>(\d{4})<\/td>/);
      const ucdVersion = resolveUCDVersion(foundVersion);
      const publicUrl = `https://www.unicode.org/Public/${ucdVersion}`;

      return {
        version: foundVersion,
        documentationUrl: documentationUrl!,
        date: dateMatch?.[1] ?? null,
        url: publicUrl,
        mappedUcdVersion: ucdVersion === foundVersion ? null : ucdVersion,
        type: draft === foundVersion ? "draft" : "stable",
      };
    }

    // Check if it's the draft version
    if (draft === version) {
      const draftUcdVersion = resolveUCDVersion(draft);
      return {
        version: draft,
        documentationUrl: `https://www.unicode.org/versions/Unicode${draft}/`,
        date: null,
        url: `https://www.unicode.org/Public/${draft}`,
        mappedUcdVersion: draftUcdVersion === draft ? null : draftUcdVersion,
        type: "draft",
      };
    }

    return null;
  } catch {
    return null;
  }
}

async function calculateStatistics(
  _bucket: NonNullable<HonoEnv["Bindings"]["UCD_BUCKET"]>,
  _version: string,
): Promise<{ totalCharacters: number; newCharacters: number; totalBlocks: number; newBlocks: number; totalScripts: number; newScripts: number } | null> {
  try {
    // Calculate new characters/blocks/scripts by comparing with previous version
    // For now, we'll return 0 for new counts as calculating them requires comparing with previous version
    // This can be enhanced later to fetch previous version data
    return {
      totalCharacters: 0,
      newCharacters: 0,
      totalBlocks: 0,
      newBlocks: 0,
      totalScripts: 0,
      newScripts: 0,
    };
  } catch {
    return null;
  }
}

V1_VERSIONS_ROUTER.openapi(GET_VERSION_ROUTE, async (c) => {
  try {
    let version = c.req.param("version");

    if (version === "latest") {
      version = UNICODE_STABLE_VERSION;
    }

    if (
      !UNICODE_VERSION_METADATA.map((v) => v.version)
        .includes(version as typeof UNICODE_VERSION_METADATA[number]["version"])) {
      return badRequest(c, {
        message: "Invalid Unicode version",
      });
    }

    const versionInfo = await getVersionFromList(version);
    if (!versionInfo) {
      return notFound(c, {
        message: "Unicode version not found",
      });
    }

    // Try to get statistics from bucket if available
    const bucket = c.env.UCD_BUCKET;
    let statistics = null;
    if (bucket) {
      statistics = await calculateStatistics(bucket, version);
    }

    return c.json({
      ...versionInfo,
      statistics: statistics ?? undefined,
    }, 200);
  } catch (error) {
    log.error("Error fetching version details", { error });
    return internalServerError(c, {
      message: "Failed to fetch version details",
    });
  }
});

V1_VERSIONS_ROUTER.openapi(GET_VERSION_FILE_TREE_ROUTE, async (c) => {
  try {
    let version = c.req.param("version");

    if (version === "latest") {
      version = UNICODE_STABLE_VERSION;
    }

    const mappedVersion = resolveUCDVersion(version);

    if (
      !UNICODE_VERSION_METADATA.map((v) => v.version)
        .includes(version as typeof UNICODE_VERSION_METADATA[number]["version"])) {
      return badRequest(c, {
        message: "Invalid Unicode version",
      });
    }

    const result = await traverse(`https://unicode.org/Public/${mappedVersion}${hasUCDFolderPath(mappedVersion) ? "/ucd" : ""}`, {
      format: "F2",
    });

    return c.json(result, 200);
  } catch (error) {
    console.error("Error processing directory:", error);
    return internalServerError(c, {
      message: "Failed to fetch file mappings",
    });
  }
});
