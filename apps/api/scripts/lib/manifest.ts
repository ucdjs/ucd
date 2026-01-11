import type { ExpectedFile } from "@ucdjs/schemas";
import { DEFAULT_EXCLUDED_EXTENSIONS } from "@ucdjs-internal/shared";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { traverse } from "apache-autoindex-parse/traverse";

export const USER_AGENT = "ucdjs (+https://github.com/ucdjs/ucd)";

const EXCLUDED_EXTENSIONS = new Set(
  (DEFAULT_EXCLUDED_EXTENSIONS as readonly string[]).map((ext) => ext.toLowerCase()),
);

function shouldExcludeFile(filePath: string): boolean {
  const lowerPath = filePath.toLowerCase();
  for (const ext of EXCLUDED_EXTENSIONS) {
    if (lowerPath.endsWith(ext)) {
      return true;
    }
  }
  return false;
}

export async function fetchExpectedFilesForVersion(version: string): Promise<ExpectedFile[]> {
  const hasUcdFolder = hasUCDFolderPath(version);
  const baseUrl = `https://unicode.org/Public/${version}${hasUcdFolder ? "/ucd" : ""}`;

  const files: ExpectedFile[] = [];

  await traverse(baseUrl, {
    extraHeaders: {
      "User-Agent": USER_AGENT,
    },
    onFile: (file) => {
      const relativePath = file.path.replace(`/${version}/`, "").replace(/^\//, "");
      if (!relativePath || shouldExcludeFile(relativePath)) {
        return;
      }

      const name = relativePath.split("/").pop() ?? relativePath;

      files.push({
        name,
        path: `/${version}${hasUcdFolder ? "/ucd" : ""}/${relativePath}`,
        storePath: `/${version}/${relativePath}`,
      });
    },
  });

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export function buildManifest(expectedFiles: ExpectedFile[]) {
  return { expectedFiles };
}
