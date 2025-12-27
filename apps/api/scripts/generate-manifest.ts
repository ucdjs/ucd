import type { UnicodeVersion } from "@ucdjs/schemas";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { DEFAULT_EXCLUDED_EXTENSIONS } from "@ucdjs-internal/shared";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { traverse } from "apache-autoindex-parse/traverse";

const USER_AGENT = "ucdjs (+https://github.com/ucdjs/ucd)";

/**
 * Set of excluded extensions for fast lookup.
 */
const EXCLUDED_EXTENSIONS = new Set(
  (DEFAULT_EXCLUDED_EXTENSIONS as readonly string[]).map((ext) => ext.toLowerCase()),
);

/**
 * Checks if a file path should be excluded based on its extension.
 */
function shouldExcludeFile(filePath: string): boolean {
  const lowerPath = filePath.toLowerCase();
  for (const ext of EXCLUDED_EXTENSIONS) {
    if (lowerPath.endsWith(ext)) {
      return true;
    }
  }
  return false;
}

async function fetchFilesForVersion(version: string): Promise<string[]> {
  const baseUrl = `https://unicode.org/Public/${version}${hasUCDFolderPath(version) ? "/ucd" : ""}`;

  try {
    const files: string[] = [];

    await traverse(baseUrl, {
      extraHeaders: {
        "User-Agent": USER_AGENT,
      },
      onFile: (file) => {
        const relativePath = file.path.replace(`/${version}/`, "").replace(/^\//, "");
        if (relativePath && !shouldExcludeFile(relativePath)) {
          files.push(relativePath);
        }
      },
    });

    // Sort for consistent ordering (important for checksum comparison)
    return files.sort();
  } catch (error) {
    console.error(`Failed to fetch files for ${version}:`, error);
    return [];
  }
}

export interface GenerateManifestOptions {
  outputDir?: string;
  apiBaseUrl?: string;
}

export async function runGenerateManifest(options: GenerateManifestOptions = {}): Promise<void> {
  const {
    outputDir = "manifest-output",
    apiBaseUrl = "https://api.ucdjs.dev",
  } = options;

  const startTime = Date.now();

  // Fetch versions from the API
  console.log(`Fetching versions from ${apiBaseUrl}/api/v1/versions...`);
  const response = await fetch(`${apiBaseUrl}/api/v1/versions`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch versions from API: ${response.status}`);
  }

  const versions: UnicodeVersion[] = await response.json();
  console.log(`Found ${versions.length} versions to process`);

  await fs.mkdir(outputDir, { recursive: true });

  // Cache fetched files by UCD folder to avoid re-fetching shared folders
  const fileCache = new Map<string, string[]>();
  let totalFiles = 0;

  // Process versions in batches
  const BATCH_SIZE = 5;
  for (let i = 0; i < versions.length; i += BATCH_SIZE) {
    const batch = versions.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (v) => {
        const ucdFolder = v.mappedUcdVersion ?? v.version;

        // Get files from cache or fetch them
        let expectedFiles = fileCache.get(ucdFolder);
        if (!expectedFiles) {
          console.log(`Fetching files for ${v.version} from ${ucdFolder}...`);
          expectedFiles = await fetchFilesForVersion(ucdFolder);
          fileCache.set(ucdFolder, expectedFiles);
          totalFiles += expectedFiles.length;
        } else {
          console.log(`Using cached files for ${v.version} (from ${ucdFolder})`);
        }

        // Write manifest
        const versionDir = path.join(outputDir, `ucdjs-manifest-v${v.version}`);
        await fs.mkdir(versionDir, { recursive: true });

        await fs.writeFile(
          path.join(versionDir, "manifest.json"),
          JSON.stringify({ expectedFiles }, null, 2),
        );

        await fs.writeFile(
          path.join(versionDir, ".ucdjs-meta.json"),
          JSON.stringify({
            version: v.version,
            generatedAt: new Date().toISOString(),
            fileCount: expectedFiles.length,
          }, null, 2),
        );
      }),
    );

    if (i + BATCH_SIZE < versions.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const duration = Date.now() - startTime;
  console.log(`Generated ${versions.length} manifests in ${duration}ms`);
  console.log(`Total files tracked: ${totalFiles}`);
  console.log(`Output: ${outputDir}/`);
}
