import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import type {
  InternalUCDStoreContext,
  UCDStoreOperations,
  UCDStoreOptions,
  UCDStoreV2,
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
import { join } from "pathe";
import { UCDStoreGenericError } from "../errors";
import { bootstrap } from "./bootstrap";
import { createInternalContext, createPublicContext } from "./context";
import { readManifest, writeManifest } from "./manifest";
import { createStoreMethods } from "./retrieval";
import { verify } from "./verify";

const debug = createDebugger("ucdjs:ucd-store:v2");

export async function createUCDStore(options: UCDStoreOptions): Promise<UCDStoreV2> {
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
  const manifestPath = join(basePath, ".ucd-store.json");

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

  // check for existing manifest
  const manifestExists = await fs.exists(manifestPath);
  debug?.("Manifest exists:", manifestExists, "at path:", manifestPath);

  let storeVersions = versions;

  // create the internal context
  const internalContext = createInternalContext({
    client,
    filter,
    fs,
    basePath,
    versions: storeVersions,
    manifestPath,
  });

  // if there is a manifest, we can skip the bootstrap process
  // and just use the versions from the manifest
  if (manifestExists) {
    const manifest = await readManifest(fs, manifestPath);
    const manifestVersions = Object.keys(manifest);
    debug?.("Manifest versions:", manifestVersions);

    // If user provided versions, handle according to strategy
    if (versions.length > 0) {
      storeVersions = await handleVersionConflict(
        versionStrategy,
        versions,
        manifestVersions,
        fs,
        manifestPath,
      );
    } else {
      // No versions provided, use manifest
      storeVersions = manifestVersions;
      debug?.("Using versions from manifest:", storeVersions);
    }

    internalContext.versions = storeVersions;

    if (shouldVerify) {
      const verifyResult = await verify(internalContext);

      if (!verifyResult.valid) {
        throw new UCDStoreGenericError(
          `Manifest verification failed: ${verifyResult.missingVersions.length} version(s) in manifest are not available in API: ${verifyResult.missingVersions.join(", ")}`,
        );
      }
    }
  } else {
    // If there isn't a manifest, and bootstrap is disabled, throw an error
    // because we can't proceed without a manifest. SINCE there is no data!
    if (!shouldBootstrap) {
      throw new UCDStoreGenericError(
        `Store manifest not found at ${manifestPath} and bootstrap is disabled. `
        + `Enable bootstrap or create manifest manually.`,
      );
    }

    await bootstrap(internalContext);
  }

  const publicContext = createPublicContext(internalContext);

  return Object.assign(
    publicContext,
    createStoreMethods(internalContext),
    createUCDStoreOperations(internalContext),
  );
}

function createUCDStoreOperations(_context: InternalUCDStoreContext): UCDStoreOperations {
  return {

  } as UCDStoreOperations;
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
  manifestVersions: string[],
  fs: FileSystemBridge,
  manifestPath: string,
): Promise<string[]> {
  switch (strategy) {
    case "merge": {
      const mergedVersions = Array.from(new Set([...manifestVersions, ...providedVersions]));
      await writeManifest(fs, manifestPath, mergedVersions);
      debug?.("Merge mode: combined versions", mergedVersions);
      return mergedVersions;
    }
    case "overwrite": {
      await writeManifest(fs, manifestPath, providedVersions);
      debug?.("Overwrite mode: replaced manifest with provided versions", providedVersions);
      return providedVersions;
    }
    case "strict":
    default: {
      if (!arraysEqual(providedVersions, manifestVersions)) {
        throw new UCDStoreGenericError(
          `Version mismatch: manifest has [${manifestVersions.join(", ")}], provided [${providedVersions.join(", ")}]. `
          + `Use versionStrategy: "merge" or "overwrite" to resolve.`,
        );
      }
      debug?.("Strict mode: versions match manifest");
      return manifestVersions;
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
