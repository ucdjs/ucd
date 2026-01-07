import type { PathFilterOptions } from "@ucdjs-internal/shared";
import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge, FileSystemBridgeFactory } from "@ucdjs/fs-bridge";
import type { LockfileInput } from "@ucdjs/schemas";
import type z from "zod";
import type { InternalUCDStoreContext } from "../../src/types";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { getLockfilePath, writeLockfile } from "@ucdjs/lockfile";
import { createInternalContext } from "../../src/context";

export interface CreateTestContextOptions {
  /**
   * Base path for the store
   * @default "/test"
   */
  basePath?: string;

  /**
   * List of Unicode versions to use.
   * These are set as both `userProvided` and `resolved` versions.
   * @default []
   */
  versions?: string[];

  /**
   * Custom lockfile path (if not provided, will be generated from basePath)
   */
  lockfilePath?: string;

  /**
   * Lockfile to create (if provided, will be written to filesystem)
   */
  lockfile?: LockfileInput;

  /**
   * Initial files to create in the filesystem
   * Keys are file paths, values are file contents
   */
  initialFiles?: Record<string, string>;

  /**
   * Global filters to apply
   */
  globalFilters?: PathFilterOptions;

  /**
   * Custom client instance (if not provided, will create default)
   */
  client?: UCDClient;

  /**
   * Base URL for API client
   * @default UCDJS_API_BASE_URL
   */
  baseUrl?: string;

  /**
   * Custom filesystem bridge (if not provided, will create default)
   */
  fs?: FileSystemBridge;
}

export interface TestContext {
  /** Internal context for testing store internals directly */
  context: InternalUCDStoreContext;
  /** The instantiated filesystem bridge */
  fs: FileSystemBridge;
  /** A factory that returns the same fs instance - for use with createUCDStore */
  fsFactory: FileSystemBridgeFactory<z.ZodUndefined>;
  client: UCDClient;
  basePath: string;
  lockfilePath: string;
}

/**
 * Wraps an existing FileSystemBridge into a factory function.
 * Used by tests that need to call `createUCDStore()` which expects a factory.
 * @internal
 */
function wrapBridgeAsFactory(bridge: FileSystemBridge): FileSystemBridgeFactory<z.ZodUndefined> {
  return () => bridge;
}

/**
 * Creates a test context with sensible defaults
 * Handles creation of client, filesystem, and internal context
 *
 * Note: If lockfile is provided, it will be written to the filesystem.
 * This function is async because writing the lockfile may be needed.
 */
export async function createTestContext(
  options?: CreateTestContextOptions,
): Promise<TestContext> {
  const basePath = options?.basePath ?? "/test";
  const versions = options?.versions ?? [];
  const lockfilePath = options?.lockfilePath ?? getLockfilePath();
  const globalFilters = options?.globalFilters ?? {};

  // Create filesystem with initial files and basePath for path sandboxing
  const fs = options?.fs ?? createMemoryMockFS({
    basePath,
    initialFiles: options?.initialFiles,
  });

  // Create client
  const client = options?.client ?? createUCDClientWithConfig(
    options?.baseUrl ?? UCDJS_API_BASE_URL,
    getDefaultUCDEndpointConfig(),
  );

  // Create filter
  const filter = createPathFilter(globalFilters);

  let lockfileExists = false;

  // Write lockfile if provided
  if (options?.lockfile) {
    await writeLockfile(fs, lockfilePath, options.lockfile);
    lockfileExists = true;
  }

  // Create internal context with resolved versions set directly
  const context = createInternalContext({
    client,
    filter,
    fs,
    lockfile: {
      supports: true,
      exists: lockfileExists,
      path: lockfilePath,
    },
    versions: {
      userProvided: versions,
      configFile: [],
      resolved: versions,
    },
  });

  return {
    context,
    fs,
    fsFactory: wrapBridgeAsFactory(fs),
    client,
    basePath,
    lockfilePath,
  };
}
