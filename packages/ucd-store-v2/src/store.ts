import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import type {
  UCDStore,
  UCDStoreOperations,
  UCDStoreOptions,
  VersionConflictStrategy,
} from "./types";
import {
  createDebugger,
  createPathFilter,
  discoverEndpointsFromConfig,
  getDefaultUCDEndpointConfig,
} from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import defu from "defu";
import { createInternalContext, createPublicContext } from "./core/context";
import { getLockfilePath, readLockfileOrDefault } from "./core/lockfile";
import { UCDStoreGenericError } from "./errors";
import { analyze } from "./operations/analyze";
import { getFile } from "./operations/files/get";
import { listFiles } from "./operations/files/list";
import { getFileTree } from "./operations/files/tree";
import { mirror } from "./operations/mirror";
import { sync } from "./operations/sync";
import { bootstrap } from "./setup/bootstrap";
import { verify } from "./setup/verify";

const debug = createDebugger("ucdjs:ucd-store");

export async function createUCDStore(options: UCDStoreOptions): Promise<UCDStore> {
  debug?.("Creating UCD Store with options", options);
  const {
    baseUrl,
    globalFilters,
    fs,
    basePath,
    versions,
    endpointConfig,
    bootstrap: shouldBootstrap,
    verify: shouldVerify,
    versionStrategy,
  } = defu(options, {
    baseUrl: UCDJS_API_BASE_URL,
    globalFilters: {},
    basePath: "",
    versions: [],
    bootstrap: true,
    verify: false,
    versionStrategy: "strict" as const,
  });

  const filter = createPathFilter(globalFilters);
  const lockfilePath = getLockfilePath(basePath);

  // resolve the endpoints config
  let resolvedEndpointConfig = endpointConfig;
  let client = options.client;

  if (!resolvedEndpointConfig && !client) {
    debug?.("No endpoint config or client provided, will attempt to discover.");
    resolvedEndpointConfig = await retrieveEndpointConfiguration(baseUrl);
  }

  if (!client) {
    debug?.("No client provided, creating UCD client with resolved endpoint config.");
    client = createUCDClientWithConfig(baseUrl, resolvedEndpointConfig!);
  }

  // Extract versions from config if available
  const configVersions = resolvedEndpointConfig?.versions;

  // check for existing lockfile
  const lockfileExists = await fs.exists(lockfilePath);
  debug?.("Lockfile exists:", lockfileExists, "at path:", lockfilePath);

  let storeVersions = versions;

  // create the internal context
  const internalContext = createInternalContext({
    client,
    filter,
    fs,
    basePath,
    versions: storeVersions,
    lockfilePath,
  });

  // if there is a lockfile, we can skip the bootstrap process
  // and just use the versions from the lockfile
  if (lockfileExists) {
    const lockfile = await readLockfileOrDefault(fs, lockfilePath);
    const lockfileVersions = lockfile ? Object.keys(lockfile.versions) : [];
    debug?.("Lockfile versions:", lockfileVersions);

    // If user provided versions, handle according to strategy
    if (versions.length > 0) {
      storeVersions = await handleVersionConflict(
        versionStrategy,
        versions,
        lockfileVersions,
        fs,
        lockfilePath,
        configVersions,
      );
    } else {
      // No versions provided, use lockfile or config
      if (lockfileVersions.length > 0) {
        storeVersions = lockfileVersions;
        debug?.("Using versions from lockfile:", storeVersions);
      } else if (configVersions && configVersions.length > 0) {
        storeVersions = configVersions;
        debug?.("Using versions from config:", storeVersions);
      }
    }

    internalContext.versions = storeVersions;

    if (shouldVerify) {
      const verifyResult = await verify({
        client,
        lockfilePath,
        fs,
        versions: storeVersions,
      });

      if (!verifyResult.valid) {
        throw new UCDStoreGenericError(
          `Lockfile verification failed: ${verifyResult.missingVersions.length} version(s) in lockfile are not available in API: ${verifyResult.missingVersions.join(", ")}`,
        );
      }
    }
  } else {
    // If there isn't a lockfile, and bootstrap is disabled, throw an error
    // because we can't proceed without a lockfile. SINCE there is no data!
    if (!shouldBootstrap) {
      throw new UCDStoreGenericError(
        `Store lockfile not found at ${lockfilePath} and bootstrap is disabled. `
        + `Enable bootstrap or create lockfile manually.`,
      );
    }

    // Use versions from config if available, otherwise use provided versions
    if (!storeVersions.length && configVersions && configVersions.length > 0) {
      storeVersions = configVersions;
      debug?.("Using versions from config for bootstrap:", storeVersions);
    }

    internalContext.versions = storeVersions;
    await bootstrap(internalContext);
  }

  const publicContext = createPublicContext(internalContext);

  return Object.assign(publicContext, {
    files: {
      get(version, path, options) {
        return getFile(internalContext, version, path, options);
      },
      list(version, options) {
        return listFiles(internalContext, version, options);
      },
      tree(version, options) {
        return getFileTree(internalContext, version, options);
      },
    },
    mirror: (options) => mirror(internalContext, options),
    sync: (options) => sync(internalContext, options),
    analyze: (options) => analyze(internalContext, options),
  } satisfies UCDStoreOperations);
}

async function retrieveEndpointConfiguration(baseUrl: string = UCDJS_API_BASE_URL): Promise<UCDWellKnownConfig> {
  debug?.("Attempting to discover endpoint configuration from", baseUrl);
  return discoverEndpointsFromConfig(baseUrl).catch((err) => {
    debug?.("Failed to discover endpoint config, using default:", err);
    return getDefaultUCDEndpointConfig();
  });
}

export async function handleVersionConflict(
  strategy: VersionConflictStrategy,
  providedVersions: string[],
  lockfileVersions: string[],
  fs: FileSystemBridge,
  lockfilePath: string,
  _configVersions?: string[],
): Promise<string[]> {
  switch (strategy) {
    case "merge": {
      const mergedVersions = Array.from(new Set([...lockfileVersions, ...providedVersions]));
      const existing = await readLockfileOrDefault(fs, lockfilePath);
      const { writeLockfile } = await import("./core/lockfile");

      await writeLockfile(fs, lockfilePath, {
        lockfileVersion: 1,
        versions: Object.fromEntries(
          mergedVersions.map((v) => {
            const existingEntry = existing?.versions[v];
            return [
              v,
              existingEntry ?? {
                path: `v${v}/snapshot.json`, // relative path
                fileCount: 0,
                totalSize: 0,
              },
            ];
          }),
        ),
      });
      debug?.("Merge mode: combined versions", mergedVersions);
      return mergedVersions;
    }
    case "overwrite": {
      const existing = await readLockfileOrDefault(fs, lockfilePath);
      const { writeLockfile } = await import("./core/lockfile");

      await writeLockfile(fs, lockfilePath, {
        lockfileVersion: 1,
        versions: Object.fromEntries(
          providedVersions.map((v) => {
            const existingEntry = existing?.versions[v];
            return [
              v,
              existingEntry ?? {
                path: `v${v}/snapshot.json`, // relative path
                fileCount: 0,
                totalSize: 0,
              },
            ];
          }),
        ),
      });
      debug?.("Overwrite mode: replaced lockfile with provided versions", providedVersions);
      return providedVersions;
    }
    case "strict":
    default: {
      if (!arraysEqual(providedVersions, lockfileVersions)) {
        throw new UCDStoreGenericError(
          `Version mismatch: lockfile has [${lockfileVersions.join(", ")}], provided [${providedVersions.join(", ")}]. `
          + `Use versionStrategy: "merge" or "overwrite" to resolve.`,
        );
      }
      debug?.("Strict mode: versions match lockfile");
      return lockfileVersions;
    }
  }
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  const setA = new Set(a);
  const setB = new Set(b);

  // If sets have different sizes, there were duplicates or different elements
  if (setA.size !== setB.size) return false;

  // Check if all elements in setA exist in setB
  for (const val of setA) {
    if (!setB.has(val)) return false;
  }

  return true;
}
