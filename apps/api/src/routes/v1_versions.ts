import type { HonoEnv } from "../types";
import type { UnicodeVersion } from "./v1_versions.schemas";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getCurrentDraftVersion, hasUCDFolderPath, resolveUCDVersion, UNICODE_TO_UCD_VERSION_MAPPINGS, UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { internalServerError, notFound } from "@ucdjs/worker-shared";
import { cache } from "hono/cache";
import { GET_SUPPORTED_VERSIONS_ROUTE, GET_UNICODE_MAPPINGS, GET_UNICODE_VERSION_METADATA, LIST_ALL_UNICODE_VERSIONS_ROUTE } from "./v1_versions.openapi";

export const V1_VERSIONS_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/versions");

V1_VERSIONS_ROUTER.get("*", cache({
  cacheName: "unicode-api:v1-versions",
  cacheControl: "max-age=345600", // 4 days
}));

V1_VERSIONS_ROUTER.openapi(LIST_ALL_UNICODE_VERSIONS_ROUTE, async (c) => {
  try {
    const response = await fetch("https://www.unicode.org/versions/enumeratedversions.html");
    if (!response.ok) {
      return internalServerError(c, {
        message: "Failed to fetch Unicode versions",
      });
    }

    const html = await response.text();

    // find any table that contains Unicode version information
    const versionPattern = /Unicode \d+\.\d+\.\d+/;
    const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/g)?.find((table) =>
      versionPattern.test(table),
    );

    if (!tableMatch) {
      return notFound(c, {
        message: "Unicode versions table not found",
      });
    }

    const draft = await getCurrentDraftVersion().catch(() => null);

    const versions: UnicodeVersion[] = [];

    // match any row that contains a cell
    const rows = tableMatch.match(/<tr>[\s\S]*?<\/tr>/g) || [];

    for (const row of rows) {
      // look for Unicode version pattern in the row
      const versionMatch = row.match(new RegExp(`<a[^>]+href="([^"]+)"[^>]*>\\s*(${versionPattern.source})\\s*</a>`));
      if (!versionMatch) continue;

      const documentationUrl = versionMatch[1];
      const version = versionMatch[2]!.replace("Unicode ", "");

      // look for a year pattern anywhere in the row
      const dateMatch = row.match(/<td[^>]*>(\d{4})<\/td>/);
      if (!dateMatch) continue;
      const ucdVersion = resolveUCDVersion(version);
      const ucdUrl = `https://www.unicode.org/Public/${ucdVersion}/${hasUCDFolderPath(ucdVersion) ? "ucd" : ""}`;

      versions.unshift({
        version,
        documentationUrl: documentationUrl!,
        date: dateMatch[1]!,
        ucdUrl,
        status: draft === version ? "draft" : "stable",
      });
    }

    if (draft != null && !versions.some((v) => v.status === "draft")) {
      versions.push({
        version: draft,
        documentationUrl: `https://www.unicode.org/versions/Unicode${draft}/`,
        date: null,
        ucdUrl: `https://www.unicode.org/Public/${draft}/ucd`,
        status: "draft",
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
  } catch (error) {
    console.error("Error fetching Unicode versions:", error);
    return internalServerError(c);
  }
});

V1_VERSIONS_ROUTER.openapi(GET_UNICODE_MAPPINGS, async (c) => {
  return c.json(UNICODE_TO_UCD_VERSION_MAPPINGS, 200);
});

V1_VERSIONS_ROUTER.openapi(GET_UNICODE_VERSION_METADATA, async (c) => {
  return c.json(UNICODE_VERSION_METADATA, 200);
});

V1_VERSIONS_ROUTER.openapi(GET_SUPPORTED_VERSIONS_ROUTE, async (c) => {
  return c.json(UNICODE_VERSION_METADATA, 200);
});
