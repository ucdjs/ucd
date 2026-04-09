import type { UnicodeVersion } from "../types";
import { getCurrentDraftVersion, resolveUCDVersion } from "@unicode-utils/core";
import { createLogger } from "./logger";

const logger = createLogger("ucdjs-scripts:upstream-versions");
const VERSION_LABEL_RE = /Unicode \d+\.\d+\.\d+/;
const TABLE_RE = /<table[^>]*>[\s\S]*?<\/table>/g;
const TABLE_ROW_RE = /<tr>[\s\S]*?<\/tr>/g;
const YEAR_CELL_RE = /<td[^>]*>(\d{4})<\/td>/;

async function getDraftVersionText() {
  const response = await fetch("https://unicode.org/Public/draft/ReadMe.txt");

  if (!response.ok) {
    throw new Error(`Failed to fetch draft ReadMe: HTTP ${response.status}`);
  }

  return response.text();
}

export async function getUpstreamVersions(): Promise<UnicodeVersion[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch("https://www.unicode.org/versions/enumeratedversions.html", {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Unicode versions page: HTTP ${response.status}`);
    }

    const html = await response.text();
    const tableMatch = html.match(TABLE_RE)?.find((table) => VERSION_LABEL_RE.test(table));
    if (!tableMatch) {
      throw new Error("Could not find version table in Unicode versions page");
    }

    let draft: string | null = null;
    try {
      draft = await getCurrentDraftVersion({
        text: await getDraftVersionText(),
        onError(error) {
          logger.error("Error fetching current draft version", error);
        },
        onNotFound() {},
        onSuccess() {},
      });
    } catch (error) {
      logger.warn("Failed to resolve current draft version", error);
    }

    const versions: UnicodeVersion[] = [];
    const rows = tableMatch.match(TABLE_ROW_RE) || [];

    for (const row of rows) {
      const versionMatch = row.match(new RegExp(`<a[^>]+href="([^"]+)"[^>]*>\\s*(${VERSION_LABEL_RE.source})\\s*</a>`));
      if (!versionMatch) {
        continue;
      }

      const version = versionMatch[2]!.replace("Unicode ", "");
      const dateMatch = row.match(YEAR_CELL_RE);
      if (!dateMatch) {
        continue;
      }

      const mappedUcdVersion = resolveUCDVersion(version);
      versions.unshift({
        version,
        date: dateMatch[1]!,
        mappedUcdVersion: mappedUcdVersion === version ? undefined : mappedUcdVersion,
        status: draft === version ? "draft" : "stable",
      });
    }

    if (draft != null && !versions.some((version) => version.version === draft)) {
      const mappedUcdVersion = resolveUCDVersion(draft);
      versions.push({
        version: draft,
        date: null,
        mappedUcdVersion: mappedUcdVersion === draft ? undefined : mappedUcdVersion,
        status: "draft",
      });
    }

    versions.sort((a, b) => {
      const [majorA = 0, minorA = 0, patchA = 0] = a.version.split(".").map(Number);
      const [majorB = 0, minorB = 0, patchB = 0] = b.version.split(".").map(Number);

      if (majorA !== majorB) return majorB - majorA;
      if (minorA !== minorB) return minorB - minorA;
      return patchB - patchA;
    });

    return versions;
  } finally {
    clearTimeout(timeout);
  }
}
