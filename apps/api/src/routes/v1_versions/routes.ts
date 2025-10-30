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
