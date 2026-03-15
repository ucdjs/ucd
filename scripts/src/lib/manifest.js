import { createHash } from "node:crypto";
import { DEFAULT_EXCLUDED_EXTENSIONS } from "@ucdjs-internal/shared";
import { createTar } from "nanotar";
import { logger } from "./logger.js";
import { getClient } from "./utils.js";

/**
 * @typedef {import("@ucdjs/schemas").ExpectedFile} ExpectedFile
 * @typedef {import("@ucdjs/schemas").UnicodeFileTree} UnicodeFileTree
 * @typedef {import("@ucdjs/schemas").UnicodeVersionList} UnicodeVersionList
 * @typedef {import("../types.js").GeneratedManifest} GeneratedManifest
 * @typedef {import("../types.js").GenerateManifestsOptions} GenerateManifestsOptions
 */

const EXCLUDED_EXTENSIONS = new Set(
  DEFAULT_EXCLUDED_EXTENSIONS.map((extension) => extension.toLowerCase()),
);
const VERSIONED_UCD_PREFIX_RE = /^(\/[^/]+)\/ucd\//;

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function shouldExcludeFile(filePath) {
  const lowerPath = filePath.toLowerCase();
  for (const extension of EXCLUDED_EXTENSIONS) {
    if (lowerPath.endsWith(extension)) {
      return true;
    }
  }
  return false;
}

/**
 * @template T
 * @param {import("@ucdjs-internal/shared").SafeFetchResponse<T>} response
 * @returns {T}
 */
function unwrap(response) {
  if (response.error || !response.data) {
    throw response.error ?? new Error("Missing data from API response");
  }
  return response.data;
}

/**
 * @param {UnicodeFileTree} tree
 * @returns {ExpectedFile[]}
 */
function mapFileTreeToExpected(tree) {
  /** @type {ExpectedFile[]} */
  const collect = [];

  /**
   * @param {UnicodeFileTree} nodes
   * @returns {void}
   */
  const walk = (nodes) => {
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

      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  };

  walk(tree);
  return collect.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * @param {GenerateManifestsOptions=} options
 * @returns {Promise<GeneratedManifest[]>}
 */
export async function generateManifests(options = {}) {
  const {
    versions: inputVersions,
    apiBaseUrl = "https://api.ucdjs.dev",
    batchSize = 5,
  } = options;

  const client = await getClient(apiBaseUrl);

  /** @type {Array<{ version: string }>} */
  let versionsToProcess;

  if (inputVersions && inputVersions.length > 0) {
    versionsToProcess = inputVersions.map((version) => ({ version }));
  } else {
    logger.info(`Fetching versions from ${apiBaseUrl}...`);
    const allVersions = unwrap(await client.versions.list());
    versionsToProcess = allVersions.map((version) => ({ version: version.version }));
    logger.info(`Found ${versionsToProcess.length} versions to process`);
  }

  /** @type {GeneratedManifest[]} */
  const results = [];
  /** @type {Map<string, ExpectedFile[]>} */
  const fileCache = new Map();

  for (let index = 0; index < versionsToProcess.length; index += batchSize) {
    const batch = versionsToProcess.slice(index, index + batchSize);

    const batchResults = await Promise.all(
      batch.map(async ({ version }) => {
        let expectedFiles = fileCache.get(version);
        if (!expectedFiles) {
          logger.info(`Fetching files for ${version}...`);
          const fileTree = unwrap(await client.versions.getFileTree(version));
          expectedFiles = mapFileTreeToExpected(fileTree);
          fileCache.set(version, expectedFiles);
        } else {
          logger.debug(`Using cached files for ${version}`);
        }

        return {
          version,
          manifest: { expectedFiles },
          fileCount: expectedFiles.length,
        };
      }),
    );

    results.push(...batchResults);

    if (index + batchSize < versionsToProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * @param {GeneratedManifest[]} manifests
 * @returns {Uint8Array}
 */
export function createManifestsTar(manifests) {
  const tarFiles = manifests.map((manifest) => ({
    name: `${manifest.version}/manifest.json`,
    data: new TextEncoder().encode(JSON.stringify(manifest.manifest, null, 2)),
  }));

  return createTar(tarFiles);
}

/**
 * @param {GeneratedManifest} manifest
 * @returns {Uint8Array}
 */
export function createManifestTar(manifest) {
  return createTar([
    {
      name: "manifest.json",
      data: new TextEncoder().encode(JSON.stringify(manifest.manifest, null, 2)),
    },
  ]);
}

/**
 * @param {{ expectedFiles: ExpectedFile[] }} manifest
 * @returns {string}
 */
export function createManifestEtag(manifest) {
  const manifestBody = JSON.stringify(manifest, null, 2);
  const hash = createHash("md5").update(manifestBody).digest("hex");

  return `"${hash}"`;
}
