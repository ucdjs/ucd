import type { ExpectedFile } from "@ucdjs/schemas";
import { DEFAULT_EXCLUDED_EXTENSIONS } from "@ucdjs-internal/shared";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { traverse } from "apache-autoindex-parse/traverse";
import { logger } from "./logger";

export const USER_AGENT = "ucdjs-scripts (+https://github.com/ucdjs/ucd)";

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

export interface UnicodeVersion {
  version: string;
  mappedUcdVersion?: string;
}

export interface GeneratedManifest {
  version: string;
  manifest: { expectedFiles: ExpectedFile[] };
  fileCount: number;
}

export interface GenerateManifestsOptions {
  versions?: string[];
  apiBaseUrl?: string;
  batchSize?: number;
}

/**
 * Fetches all available Unicode versions from the API.
 */
export async function fetchVersions(apiBaseUrl: string): Promise<UnicodeVersion[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/versions`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch versions from API: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches expected files for a specific Unicode version from unicode.org.
 */
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

/**
 * Builds a manifest from expected files.
 */
export function buildManifest(expectedFiles: ExpectedFile[]): { expectedFiles: ExpectedFile[] } {
  return { expectedFiles };
}

/**
 * Generates manifests for the specified versions.
 * Reuses cached data for versions that share UCD folders.
 */
export async function generateManifests(
  options: GenerateManifestsOptions = {},
): Promise<GeneratedManifest[]> {
  const {
    versions: inputVersions,
    apiBaseUrl = "https://api.ucdjs.dev",
    batchSize = 5,
  } = options;

  let versionsToProcess: Array<{ version: string; mappedUcdVersion?: string }>;

  if (inputVersions && inputVersions.length > 0) {
    versionsToProcess = inputVersions.map((v) => ({ version: v }));
  } else {
    logger.info(`Fetching versions from ${apiBaseUrl}...`);
    const allVersions = await fetchVersions(apiBaseUrl);
    versionsToProcess = allVersions.map((v) => ({
      version: v.version,
      mappedUcdVersion: v.mappedUcdVersion,
    }));
    logger.info(`Found ${versionsToProcess.length} versions to process`);
  }

  const results: GeneratedManifest[] = [];
  const fileCache = new Map<string, ExpectedFile[]>();

  for (let i = 0; i < versionsToProcess.length; i += batchSize) {
    const batch = versionsToProcess.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (v) => {
        const ucdFolder = v.mappedUcdVersion ?? v.version;

        let expectedFiles = fileCache.get(ucdFolder);
        if (!expectedFiles) {
          logger.info(`Fetching files for ${v.version} from ${ucdFolder}...`);
          expectedFiles = await fetchExpectedFilesForVersion(ucdFolder);
          fileCache.set(ucdFolder, expectedFiles);
        } else {
          logger.debug(`Using cached files for ${v.version} (from ${ucdFolder})`);
        }

        const manifest = buildManifest(expectedFiles);
        return {
          version: v.version,
          manifest,
          fileCount: expectedFiles.length,
        };
      }),
    );

    results.push(...batchResults);

    if (i + batchSize < versionsToProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}
