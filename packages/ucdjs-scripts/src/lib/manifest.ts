import type { SafeFetchResponse } from "@ucdjs-internal/shared";
import type { ExpectedFile, Snapshot, UnicodeFileTree, UnicodeVersionList } from "@ucdjs/schemas";
import type { GeneratedManifest, GenerateManifestsOptions } from "../types";
import { createHash } from "node:crypto";
import {
  computeUnicodeBytesHash,
  computeUnicodeTextHashWithoutHeader,
  createConcurrencyLimiter,
  customFetch,
  DEFAULT_EXCLUDED_EXTENSIONS,
  getUnicodeBytesSize,
} from "@ucdjs-internal/shared";
import { createTar } from "nanotar";
import { logger } from "./logger";
import { getClientContext } from "./utils";

const EXCLUDED_EXTENSIONS = new Set(
  (DEFAULT_EXCLUDED_EXTENSIONS as readonly string[]).map((ext) => ext.toLowerCase()),
);
const VERSIONED_UCD_PREFIX_RE = /^(\/[^/]+)\/ucd\//;
const SNAPSHOT_BUILD_CONCURRENCY = 8;
const SNAPSHOT_SEPARATOR = "\n--snapshot--\n";
const TEXT_DECODER = new TextDecoder();
const TEXT_CONTENT_TYPE_PREFIXES = ["text/"];
const TEXT_CONTENT_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/xhtml+xml",
  "text/csv",
]);
const TEXT_CONTENT_TYPE_SUFFIXES = ["+json", "+xml"];
const BINARY_CONTENT_TYPE_PREFIXES = ["image/", "audio/", "video/", "font/"];
const BINARY_CONTENT_TYPES = new Set([
  "application/octet-stream",
  "application/pdf",
]);
const TEXT_FILE_EXTENSIONS = new Set([
  "csv",
  "html",
  "htm",
  "json",
  "md",
  "svg",
  "txt",
  "xml",
]);

interface SnapshotSourceFile {
  bytes: Uint8Array;
  contentType: string | null;
}

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

function normalizeContentType(contentType: string | null): string | null {
  if (!contentType) {
    return null;
  }

  return contentType.split(";")[0]?.trim().toLowerCase() || null;
}

function shouldTreatAsText(path: string, contentType: string | null): boolean {
  const normalizedContentType = normalizeContentType(contentType);

  if (normalizedContentType) {
    if (
      TEXT_CONTENT_TYPES.has(normalizedContentType)
      || TEXT_CONTENT_TYPE_PREFIXES.some((prefix) => normalizedContentType.startsWith(prefix))
      || TEXT_CONTENT_TYPE_SUFFIXES.some((suffix) => normalizedContentType.endsWith(suffix))
    ) {
      return true;
    }

    if (
      BINARY_CONTENT_TYPES.has(normalizedContentType)
      || BINARY_CONTENT_TYPE_PREFIXES.some((prefix) => normalizedContentType.startsWith(prefix))
    ) {
      return false;
    }
  }

  const ext = path.split(".").pop()?.toLowerCase();
  return !!ext && TEXT_FILE_EXTENSIONS.has(ext);
}

async function fetchSnapshotSourceFile(
  apiBaseUrl: string,
  filesEndpoint: string,
  path: string,
): Promise<SnapshotSourceFile> {
  // eslint-disable-next-line e18e/prefer-static-regex
  const cleanPath = path.replace(/^\/+/, "");
  const basePath = filesEndpoint.endsWith("/") ? filesEndpoint : `${filesEndpoint}/`;
  const url = new URL(cleanPath, new URL(basePath, apiBaseUrl));
  const result = await customFetch.safe<ArrayBuffer, "arrayBuffer">(url.toString(), {
    parseAs: "arrayBuffer",
  });

  if (result.error || !result.data) {
    throw result.error ?? new Error(`Missing file content for ${path}`);
  }

  return {
    bytes: new Uint8Array(result.data),
    contentType: result.response?.headers.get("content-type") ?? null,
  };
}

async function buildSnapshot(
  version: string,
  expectedFiles: ExpectedFile[],
  readFile: (path: string) => Promise<SnapshotSourceFile>,
): Promise<Snapshot> {
  const limit = createConcurrencyLimiter(SNAPSHOT_BUILD_CONCURRENCY);

  const files = Object.fromEntries(await Promise.all(expectedFiles.map((expectedFile) => limit(async () => {
    const { bytes, contentType } = await readFile(expectedFile.path);
    const fileHash = await computeUnicodeBytesHash(bytes);
    const hash = shouldTreatAsText(expectedFile.path, contentType)
      ? await computeUnicodeTextHashWithoutHeader(TEXT_DECODER.decode(bytes))
      : fileHash;

    return [getSnapshotFilePath(expectedFile, version), {
      hash,
      fileHash,
      size: getUnicodeBytesSize(bytes),
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

  const { client, endpoints } = await getClientContext(apiBaseUrl);

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

        const snapshot = await buildSnapshot(
          version,
          expectedFiles,
          (path) => fetchSnapshotSourceFile(apiBaseUrl, endpoints.files, path),
        );

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

export function createManifestEtag(manifest: Pick<GeneratedManifest, "manifest" | "snapshot">): string {
  const manifestBody = JSON.stringify(manifest.manifest, null, 2);
  const snapshotBody = JSON.stringify(manifest.snapshot, null, 2);
  const hash = createHash("sha256").update(`${manifestBody}${SNAPSHOT_SEPARATOR}${snapshotBody}`).digest("hex");

  return `"${hash}"`;
}
