import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { ExpectedFile, Snapshot, UnicodeFileTree, UnicodeVersionList } from "@ucdjs/schemas";
import type { GeneratedManifest, GenerateManifestsOptions } from "../types";
import { createHash } from "node:crypto";
import {
  computeUnicodeFileHash,
  computeUnicodeFileHashWithoutHeader,
  createConcurrencyLimiter,
  DEFAULT_EXCLUDED_EXTENSIONS,
  getUnicodeFileSize,
} from "@ucdjs-internal/shared";
import { createTar } from "nanotar";
import { logger } from "./logger";
import { getClient } from "./utils";

const EXCLUDED_EXTENSIONS = new Set(
  (DEFAULT_EXCLUDED_EXTENSIONS as readonly string[]).map((ext) => ext.toLowerCase()),
);
const VERSIONED_UCD_PREFIX_RE = /^(\/[^/]+)\/ucd\//;
const SNAPSHOT_BUILD_CONCURRENCY = 8;

function shouldExcludeFile(filePath: string): boolean {
  const lowerPath = filePath.toLowerCase();
  for (const ext of EXCLUDED_EXTENSIONS) {
    if (lowerPath.endsWith(ext)) {
      return true;
    }
  }
  return false;
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
        collect.push({
          name: node.name,
          path: node.path,
          storePath: node.path.replace(VERSIONED_UCD_PREFIX_RE, "$1/"),
        });
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

function getSnapshotFilePath(expectedFile: ExpectedFile, version: string): string {
  const prefix = `/${version}/`;
  return expectedFile.storePath.startsWith(prefix)
    ? expectedFile.storePath.slice(prefix.length)
    // eslint-disable-next-line e18e/prefer-static-regex
    : expectedFile.storePath.replace(/^\/+/, "");
}

async function buildSnapshot(
  version: string,
  expectedFiles: ExpectedFile[],
  readFile: (path: string) => Promise<string>,
): Promise<Snapshot> {
  const limit = createConcurrencyLimiter(SNAPSHOT_BUILD_CONCURRENCY);

  const files = Object.fromEntries(await Promise.all(expectedFiles.map((expectedFile) => limit(async () => {
    const content = await readFile(expectedFile.path);
    const [hash, fileHash] = await Promise.all([
      computeUnicodeFileHashWithoutHeader(content),
      computeUnicodeFileHash(content),
    ]);

    return [getSnapshotFilePath(expectedFile, version), {
      hash,
      fileHash,
      size: getUnicodeFileSize(content),
    }] as const;
  }))));

  return {
    unicodeVersion: version,
    files,
  };
}

export async function generateManifests(
  options: GenerateManifestsOptions = {},
): Promise<GeneratedManifest[]> {
  const {
    versions: inputVersions,
    apiBaseUrl = "https://api.ucdjs.dev",
    batchSize = 5,
  } = options;

  const client = await getClient(apiBaseUrl);

  let versionsToProcess: Array<{ version: string }>;

  if (inputVersions && inputVersions.length > 0) {
    versionsToProcess = inputVersions.map((v) => ({ version: v }));
  } else {
    logger.info(`Fetching versions from ${apiBaseUrl}...`);
    const allVersions = unwrap<UnicodeVersionList>(await client.versions.list());
    versionsToProcess = allVersions.map((v) => ({ version: v.version }));
    logger.info(`Found ${versionsToProcess.length} versions to process`);
  }

  const results: GeneratedManifest[] = [];
  const fileCache = new Map<string, ExpectedFile[]>();

  for (let i = 0; i < versionsToProcess.length; i += batchSize) {
    const batch = versionsToProcess.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (v) => {
        const version = v.version;

        let expectedFiles = fileCache.get(version);
        if (!expectedFiles) {
          logger.info(`Fetching files for ${version}...`);
          const fileTree = unwrap<UnicodeFileTree>(await client.versions.getFileTree(version));
          expectedFiles = mapFileTreeToExpected(fileTree);
          fileCache.set(version, expectedFiles);
        } else {
          logger.debug(`Using cached files for ${version}`);
        }

        const snapshot = await buildSnapshot(version, expectedFiles, async (path) => {
          // eslint-disable-next-line e18e/prefer-static-regex
          const result = unwrap(await client.files.get(path.replace(/^\/+/, "")));

          if (typeof result !== "string") {
            throw new TypeError(`Expected text content for ${path}`);
          }

          return result;
        });

        const manifest = { expectedFiles };
        return {
          version,
          manifest,
          snapshot,
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
  const tarFiles = manifests.flatMap((m) => [
    {
      name: `${m.version}/manifest.json`,
      data: new TextEncoder().encode(JSON.stringify(m.manifest, null, 2)),
    },
    {
      name: `${m.version}/snapshot.json`,
      data: new TextEncoder().encode(JSON.stringify(m.snapshot, null, 2)),
    },
  ]);

  return createTar(tarFiles);
}

export function createManifestTar(manifest: GeneratedManifest): Uint8Array {
  return createTar([
    {
      name: "manifest.json",
      data: new TextEncoder().encode(JSON.stringify(manifest.manifest, null, 2)),
    },
    {
      name: "snapshot.json",
      data: new TextEncoder().encode(JSON.stringify(manifest.snapshot, null, 2)),
    },
  ]);
}

export function createManifestEtag(manifest: GeneratedManifest["manifest"]): string {
  const manifestBody = JSON.stringify(manifest, null, 2);
  const hash = createHash("md5").update(manifestBody).digest("hex");

  return `"${hash}"`;
}
