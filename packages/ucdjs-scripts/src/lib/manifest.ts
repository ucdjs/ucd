import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { ExpectedFile, UnicodeFileTree, UnicodeVersionList } from "@ucdjs/schemas";
import { DEFAULT_EXCLUDED_EXTENSIONS } from "@ucdjs-internal/shared";
import { createTar } from "nanotar";
import { getClient } from "./client";
import { logger } from "./logger";

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

function unwrap<T>(response: SafeFetchResponse<T>): T {
  if (response.error || !response.data) {
    throw response.error ?? new Error("Missing data from API response");
  }
  return response.data;
}

function mapFileTreeToExpected(tree: UnicodeFileTree): ExpectedFile[] {
  const collect: ExpectedFile[] = [];

  const walk = (nodes: UnicodeFileTree) => {
    for (const node of nodes) {
      if (node.type === "file") {
        if (shouldExcludeFile(node.path)) continue;
        collect.push({ name: node.name, path: node.path, storePath: node.path });
        continue;
      }

      // directory
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  };

  walk(tree);
  return collect.sort((a, b) => a.path.localeCompare(b.path));
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

  const client = await getClient(apiBaseUrl);

  let versionsToProcess: Array<{ version: string; mappedUcdVersion?: string }>;

  if (inputVersions && inputVersions.length > 0) {
    versionsToProcess = inputVersions.map((v) => ({ version: v }));
  } else {
    logger.info(`Fetching versions from ${apiBaseUrl}...`);
    const allVersions = unwrap<UnicodeVersionList>(await client.versions.list());
    versionsToProcess = allVersions.map((v) => ({
      version: v.version,
      mappedUcdVersion: v.mappedUcdVersion ?? undefined,
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
          const fileTree = unwrap<UnicodeFileTree>(await client.versions.getFileTree(ucdFolder));
          expectedFiles = mapFileTreeToExpected(fileTree);
          fileCache.set(ucdFolder, expectedFiles);
        } else {
          logger.debug(`Using cached files for ${v.version} (from ${ucdFolder})`);
        }

        const manifest = { expectedFiles };
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

export function createManifestsTar(manifests: GeneratedManifest[]): Uint8Array {
  const tarFiles = manifests.map((m) => ({
    name: `${m.version}/manifest.json`,
    data: new TextEncoder().encode(JSON.stringify(m.manifest, null, 2)),
  }));

  return createTar(tarFiles);
}
