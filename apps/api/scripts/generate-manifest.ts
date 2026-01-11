import type { ExpectedFile, UnicodeVersion } from "@ucdjs/schemas";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { buildManifest, fetchExpectedFilesForVersion, USER_AGENT } from "./lib/manifest";

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
  const fileCache = new Map<string, ExpectedFile[]>();
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
          expectedFiles = await fetchExpectedFilesForVersion(ucdFolder);
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
          JSON.stringify(buildManifest(expectedFiles), null, 2),
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
