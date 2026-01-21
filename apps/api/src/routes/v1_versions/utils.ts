import type { UnicodeVersion } from "@ucdjs/schemas";
import type { HonoEnv } from "../../types";
import { wrapTry } from "@ucdjs-internal/shared";
import {
  getCurrentDraftVersion,
  resolveUCDVersion,
} from "@unicode-utils/core";
import { captureParseError, captureUpstreamError, COMPONENTS } from "../../lib/sentry";

export async function getAllVersionsFromList() {
  return wrapTry(async (): Promise<UnicodeVersion[]> => {
    const controller = new AbortController();
    const response = await fetch("https://www.unicode.org/versions/enumeratedversions.html", {
      signal: controller.signal,
    });

    setTimeout(() => {
      controller.abort();
    }, 7000);

    if (!response.ok) {
      const error = new Error(`Failed to fetch Unicode versions page: HTTP ${response.status}`);
      captureUpstreamError(error, {
        component: COMPONENTS.V1_VERSIONS,
        operation: "getAllVersionsFromList",
        upstreamService: "unicode.org",
        tags: {
          http_status: response.status.toString(),
        },
        extra: {
          status: response.status,
          statusText: response.statusText,
          url: "https://www.unicode.org/versions/enumeratedversions.html",
        },
      });

      throw error;
    }

    const html = await response.text();
    const versionPattern = /Unicode \d+\.\d+\.\d+/;
    const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/g)?.find((table) =>
      versionPattern.test(table),
    );

    if (!tableMatch) {
      const error = new Error("Could not find version table in Unicode versions page");
      captureParseError(error, {
        component: COMPONENTS.V1_VERSIONS,
        operation: "getAllVersionsFromList",
        tags: {
          issue_type: "missing_table",
          upstream_service: "unicode.org",
        },
        extra: {
          html_length: html.length,
          html_preview: html.substring(0, 500), // First 500 chars for debugging
        },
      });

      throw error;
    }

    const draft = await getCurrentDraftVersion().catch(() => null);
    const versions: UnicodeVersion[] = [];

    // match any row that contains a cell
    const rows = tableMatch.match(/<tr>[\s\S]*?<\/tr>/g) || [];

    for (const row of rows) {
      // look for Unicode version pattern in the row
      const versionMatch = row.match(new RegExp(`<a[^>]+href="([^"]+)"[^>]*>\\s*(${versionPattern.source})\\s*</a>`));
      if (!versionMatch) {
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

    // sort versions by their major, minor, and patch numbers in from newest to oldest order
    versions.sort((a, b) => {
      const [majorA = 0, minorA = 0, patchA = 0] = a.version.split(".").map(Number);
      const [majorB = 0, minorB = 0, patchB = 0] = b.version.split(".").map(Number);

      if (majorA !== majorB) return majorB - majorA;
      if (minorA !== minorB) return minorB - minorA;
      return patchB - patchA;
    });

    return versions;
  });
}

export async function getVersionFromList(version: string): Promise<
  | readonly [UnicodeVersion, null]
  | readonly [null, Error]
  | readonly [null, null]
> {
  const [versions, error] = await getAllVersionsFromList();
  if (error) {
    return [null, error] as const;
  }
  if (!versions) {
    return [null, new Error("No versions available")] as const;
  }
  const versionInfo = versions.find((v) => v.version === version);
  if (!versionInfo) {
    return [null, null] as const; // null error means "not found" (404), not upstream error (502)
  }
  return [versionInfo, null] as const;
}

export async function calculateStatistics(
  bucket: NonNullable<HonoEnv["Bindings"]["UCD_BUCKET"]>,
  version: string,
): Promise<{ totalCharacters: number; newCharacters: number; totalBlocks: number; newBlocks: number; totalScripts: number; newScripts: number } | null> {
  try {
    const mappedVersion = resolveUCDVersion(version);
    const ucdPrefix = `manifest/${mappedVersion}/ucd/`;

    // Try to get UnicodeData.txt
    const unicodeDataKey = `${ucdPrefix}UnicodeData.txt`;
    const unicodeDataObj = await bucket.get(unicodeDataKey);
    if (!unicodeDataObj) return null;

    const unicodeDataText = await unicodeDataObj.text();
    const lines = unicodeDataText.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
    const totalCharacters = lines.length;

    // Try to get Blocks.txt
    const blocksKey = `${ucdPrefix}Blocks.txt`;
    const blocksObj = await bucket.get(blocksKey);
    let totalBlocks = 0;
    if (blocksObj) {
      const blocksText = await blocksObj.text();
      const blockLines = blocksText.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
      totalBlocks = blockLines.length;
    }

    // Try to get Scripts.txt
    const scriptsKey = `${ucdPrefix}Scripts.txt`;
    const scriptsObj = await bucket.get(scriptsKey);
    let totalScripts = 0;
    if (scriptsObj) {
      const scriptsText = await scriptsObj.text();
      const scriptLines = scriptsText.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
      const uniqueScripts = new Set<string>();
      for (const line of scriptLines) {
        const match = line.match(/^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*(\w+)/);
        if (match) {
          uniqueScripts.add(match[3]!);
        }
      }
      totalScripts = uniqueScripts.size;
    }

    // Calculate new characters/blocks/scripts by comparing with previous version
    // For now, we'll return 0 for new counts as calculating them requires comparing with previous version
    // This can be enhanced later to fetch previous version data
    return {
      totalCharacters,
      newCharacters: 0,
      totalBlocks,
      newBlocks: 0,
      totalScripts,
      newScripts: 0,
    };
  } catch {
    return null;
  }
}
