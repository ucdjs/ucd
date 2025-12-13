import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "apache-autoindex-parse";
import { traverse } from "apache-autoindex-parse/traverse";

const USER_AGENT = "ucdjs (+https://github.com/ucdjs/ucd)";

/**
 * Matches Unicode version directory names.
 * Supports formats like:
 * - "16.0.0", "15.1.0", "4.1.0"
 * - "4.1-Update", "4.1-Update1", "3.2-Update"
 */
// eslint-disable-next-line regexp/no-unused-capturing-group
const VERSION_PATTERN = /^(\d+)\.(\d+)(?:\.(\d+))?(?:-Update\d*)?$/;

function isVersionDirectory(name: string): boolean {
  return VERSION_PATTERN.test(name);
}

async function getExpectedFilesForVersion(version: string): Promise<string[]> {
  const baseUrl = `https://unicode.org/Public/${version}`;

  try {
    const files: string[] = [];

    await traverse(baseUrl, {
      extraHeaders: {
        "User-Agent": USER_AGENT,
      },
      onFile: (file) => {
        const relativePath = file.path.replace(`/${version}/`, "").replace(/^\//, "");
        if (relativePath) {
          files.push(relativePath);
        }
      },
    });

    return files;
  } catch (error) {
    console.error(`Failed to fetch files for version ${version}:`, error);
    return [];
  }
}

export interface GenerateManifestOptions {
  outputDir?: string;
}

export default async function generateManifest(options: GenerateManifestOptions = {}): Promise<void> {
  const { outputDir = "manifest-output" } = options;

  const startTime = Date.now();

  // Fetch version list from unicode.org
  console.log("Fetching version list from unicode.org...");
  const response = await fetch("https://unicode.org/Public?F=2", {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch unicode.org directory: ${response.status}`);
  }

  const html = await response.text();

  const entries = parse(html, "F2");

  // Filter to only version directories
  const versionDirs = entries.filter((entry) => isVersionDirectory(entry.name.replace(/\/$/, "")));
  console.log(`Found ${versionDirs.length} versions to process`);

  const store: Record<string, { expectedFiles: string[] }> = {};
  let totalFiles = 0;

  // Process versions in batches to avoid overwhelming unicode.org
  const BATCH_SIZE = 5;
  for (let i = 0; i < versionDirs.length; i += BATCH_SIZE) {
    const batch = versionDirs.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (file) => {
        const versionName = file.name.replace(/\/$/, "");
        console.log(`Processing version ${versionName}`);
        const expectedFiles = await getExpectedFilesForVersion(versionName);
        store[versionName] = { expectedFiles };
        totalFiles += expectedFiles.length;
      }),
    );

    // Small delay between batches to be polite
    if (i + BATCH_SIZE < versionDirs.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const duration = Date.now() - startTime;
  console.log(`Generated manifest with ${Object.keys(store).length} versions in ${duration}ms`);
  console.log(`Total files tracked: ${totalFiles}`);

  // Write each version to a separate directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Write individual version directories with meta file
  for (const [version, data] of Object.entries(store)) {
    const versionDir = path.join(outputDir, `ucdjs-manifest-v${version}`);
    fs.mkdirSync(versionDir, { recursive: true });

    // Write the manifest data
    fs.writeFileSync(
      path.join(versionDir, "manifest.json"),
      JSON.stringify(data, null, 2),
    );

    // Write meta file for version validation
    fs.writeFileSync(
      path.join(versionDir, ".ucdjs-meta.json"),
      JSON.stringify({
        version,
        generatedAt: new Date().toISOString(),
        fileCount: data.expectedFiles?.length || 0,
      }, null, 2),
    );
  }

  console.log(`Manifest files written to ${outputDir}/`);
}
