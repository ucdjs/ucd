import type { PathFilter } from "@ucdjs-internal/shared";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import type z from "zod";
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
import { getLockfilePath, readLockfileOrUndefined } from "@ucdjs/lockfile";
import defu from "defu";
import { createInternalContext, createPublicContext } from "./context";
import { UCDStoreGenericError } from "./errors";
import { getFile } from "./files/get";
import { listFiles } from "./files/list";
import { getFileTree } from "./files/tree";
import { analyze } from "./reports/analyze";
import { initLockfile } from "./setup/init-lockfile";
import { verify } from "./setup/verify";
import { mirror } from "./tasks/mirror";
import { sync } from "./tasks/sync";

const debug = createDebugger("ucdjs:ucd-store");

export async function createUCDStore<
  BridgeOptionsSchema extends z.ZodType,
>(options: UCDStoreOptions<BridgeOptionsSchema>): Promise<UCDStore> {
  debug?.("Creating UCD Store with options", options);
  const {
    baseUrl,
    globalFilters,
    fs: fsFactory,
    fsOptions,
    versions,
    endpointConfig,
    requireExistingStore,
    verify: shouldVerify,
    versionStrategy,
  } = defu(options, {
    baseUrl: UCDJS_API_BASE_URL,
    globalFilters: {},
    versions: [],
    requireExistingStore: true,
    verify: true,
    versionStrategy: "strict" as const,
  });

  const filter = createPathFilter(globalFilters);

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

  // Build discovery context
  const discoveryContext = {
    baseUrl,
    endpointConfig: resolvedEndpointConfig!,
    versions: resolvedEndpointConfig?.versions ?? [],
  };

  // Resolve fsOptions - can be static or a function receiving discovery context
  const resolvedFsOptions = typeof fsOptions === "function"
    ? fsOptions(discoveryContext)
    : fsOptions;

  // Call the factory with resolved options
  // We need to handle 3 cases: no-args factory, optional-args factory, required-args factory
  const fs = resolvedFsOptions !== undefined
    // @ts-expect-error - TS cannot infer the args length properly here
    ? fsFactory(resolvedFsOptions)
    // @ts-expect-error - TS cannot infer the args length properly here
    : fsFactory();

  // Lockfiles only make sense for writable file systems
  const supportsLockfile = fs.optionalCapabilities?.write === true;
  // Lockfile path is always relative
  const lockfilePath = supportsLockfile ? getLockfilePath() : null;
  debug?.("Lockfile support:", supportsLockfile, "path:", lockfilePath);

  // Extract versions from config if available
  const configVersions = resolvedEndpointConfig?.versions ?? [];

  // check for existing lockfile (only if supported)
  const lockfileExists = supportsLockfile
    ? await fs.exists(lockfilePath!)
    : false;
  debug?.("Lockfile exists:", lockfileExists);

  let storeVersions = versions;

  // create the internal context
  const internalContext = createInternalContext({
    client,
    filter,
    fs,
    lockfile: {
      supports: supportsLockfile,
      exists: lockfileExists,
      path: lockfilePath ?? "",
    },
    versions: {
      userProvided: versions,
      configFile: configVersions,
    },
  });

  // Early validation: verify that versions (from input or config) are available in API
  // This prevents wasted work if versions don't exist
  const versionsToValidate = versions.length > 0 ? versions : configVersions;
  if (versionsToValidate.length > 0) {
    const apiVersions = await internalContext.versions.apiVersions();

    if (apiVersions.length === 0) {
      debug?.("Warning: Could not fetch API versions for validation, skipping early check");
    } else {
      const invalidVersions = versionsToValidate.filter((v) => !apiVersions.includes(v));

      if (invalidVersions.length > 0) {
        const source = versions.length > 0 ? "Provided" : "Config";
        throw new UCDStoreGenericError(
          `${source} versions are not available in API: ${invalidVersions.join(", ")}. `
          + `Available versions: ${apiVersions.slice(0, 5).join(", ")}${apiVersions.length > 5 ? "..." : ""}`,
        );
      }

      debug?.("✓ Early version validation passed");
    }
  }

  // Case 1: Lockfile exists - use it
  if (internalContext.lockfile.exists && internalContext.lockfile.path) {
    const lockfile = await readLockfileOrUndefined(fs, internalContext.lockfile.path);
    const lockfileVersions = lockfile ? Object.keys(lockfile.versions) : [];
    debug?.("Lockfile versions:", lockfileVersions);

    // If user provided versions, handle according to strategy
    if (versions.length > 0) {
      storeVersions = await handleVersionConflict(
        versionStrategy,
        versions,
        lockfileVersions,
        fs,
        internalContext.lockfile.path,
        configVersions,
        filter,
      );
    } else if (lockfileVersions.length > 0) {
      storeVersions = lockfileVersions;
      debug?.("Using versions from lockfile:", storeVersions);
    } else if (configVersions.length) {
      storeVersions = configVersions;
      debug?.("Using versions from config:", storeVersions);
    }

    internalContext.versions.resolved = storeVersions;
    internalContext.lockfile.exists = true;
  }

  // Case 2: Writable bridge but no lockfile - need initialization
  if (!internalContext.lockfile.exists && internalContext.lockfile.supports) {
    if (requireExistingStore) {
      throw new UCDStoreGenericError(
        `Store lockfile not found at ${internalContext.lockfile.path}. `
        + `Initialize the store first or set requireExistingStore: false to create automatically.`,
      );
    }

    if (!storeVersions.length && configVersions.length) {
      storeVersions = configVersions;
      debug?.("Using versions from config for initialization:", storeVersions);
    }

    internalContext.versions.resolved = storeVersions;
    await initLockfile(internalContext);
    internalContext.lockfile.exists = true;
  }

  // Case 3: Read-only bridge - must have versions
  if (!internalContext.lockfile.supports) {
    if (!storeVersions.length && configVersions.length) {
      storeVersions = configVersions;
      debug?.("Read-only bridge: using versions from config:", storeVersions);
    }

    if (!storeVersions.length) {
      throw new UCDStoreGenericError(
        `No versions provided for read-only file system bridge. `
        + `Provide versions in options or ensure endpoint config is available.`,
      );
    }

    internalContext.versions.resolved = storeVersions;
    debug?.("Read-only bridge initialized with versions:", storeVersions);
  }

  // Unified verification: handles both lockfile-based and direct version validation
  if (shouldVerify && internalContext.versions.resolved.length > 0) {
    const verifyResult = await verify(internalContext);

    if (!verifyResult.valid) {
      const source = verifyResult.source === "lockfile" ? "Lockfile" : "Version";
      throw new UCDStoreGenericError(
        `${source} verification failed: ${verifyResult.invalidVersions.length} version(s) are not available in API: ${verifyResult.invalidVersions.join(", ")}`,
      );
    }

    debug?.(`✓ Verification passed (source: ${verifyResult.source})`);
  }

  const publicContext = createPublicContext(internalContext);

  return Object.assign(publicContext, {
    files: {
      get: getFile.bind(internalContext),
      list: listFiles.bind(internalContext),
      tree: getFileTree.bind(internalContext),
    },
    mirror: mirror.bind(internalContext),
    sync: sync.bind(internalContext),
    analyze: analyze.bind(internalContext),
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
  filter?: PathFilter,
): Promise<string[]> {
  const now = new Date();

  switch (strategy) {
    case "merge": {
      const mergedVersions = Array.from(new Set([...lockfileVersions, ...providedVersions]));
      const existing = await readLockfileOrUndefined(fs, lockfilePath);
      const { writeLockfile } = await import("@ucdjs/lockfile");
      const { extractFilterPatterns } = await import("./context");
      const filters = filter ? extractFilterPatterns(filter) : existing?.filters;

      await writeLockfile(fs, lockfilePath, {
        lockfileVersion: 1,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        versions: Object.fromEntries(
          mergedVersions.map((v) => {
            const existingEntry = existing?.versions[v];
            return [
              v,
              existingEntry ?? {
                path: `${v}/snapshot.json`, // relative path
                fileCount: 0,
                totalSize: 0,
                createdAt: now,
                updatedAt: now,
              },
            ];
          }),
        ),
        filters,
      });
      debug?.("Merge mode: combined versions", mergedVersions);
      return mergedVersions;
    }
    case "overwrite": {
      const existing = await readLockfileOrUndefined(fs, lockfilePath);
      const { writeLockfile } = await import("@ucdjs/lockfile");
      const { extractFilterPatterns } = await import("./context");
      const filters = filter ? extractFilterPatterns(filter) : existing?.filters;

      await writeLockfile(fs, lockfilePath, {
        lockfileVersion: 1,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        versions: Object.fromEntries(
          providedVersions.map((v) => {
            const existingEntry = existing?.versions[v];
            return [
              v,
              existingEntry ?? {
                path: `${v}/snapshot.json`, // relative path
                fileCount: 0,
                totalSize: 0,
                createdAt: now,
                updatedAt: now,
              },
            ];
          }),
        ),
        filters,
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
