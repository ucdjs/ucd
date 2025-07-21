import type { HonoEnv } from "../types";
import type { UnicodeVersion } from "./v1_versions.schemas";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getCurrentDraftVersion, resolveUCDVersion, UNICODE_STABLE_VERSION, UNICODE_TO_UCD_VERSION_MAPPINGS, UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { badRequest, internalServerError, notFound } from "@ucdjs/worker-shared";
import { traverse } from "apache-autoindex-parse/traverse";
import { GET_VERSION_FILE_TREE_ROUTE, LIST_ALL_UNICODE_VERSIONS_ROUTE, LIST_VERSION_MAPPINGS_ROUTE } from "./v1_versions.openapi";

export const V1_VERSIONS_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/versions");

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
  } catch (error) {
    console.error("Error fetching Unicode versions:", error);
    return internalServerError(c);
  }
});

V1_VERSIONS_ROUTER.openapi(LIST_VERSION_MAPPINGS_ROUTE, (c) => {
  return c.json(UNICODE_TO_UCD_VERSION_MAPPINGS, 200);
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

    const result = await traverse(`https://unicode.org/Public/${mappedVersion}`, {
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
