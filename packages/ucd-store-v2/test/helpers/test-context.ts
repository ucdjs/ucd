import type { PathFilterOptions } from "@ucdjs-internal/shared";
import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { Lockfile } from "@ucdjs/schemas";
import type { InternalUCDStoreContext } from "../../src/types";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { getLockfilePath, writeLockfile } from "@ucdjs/lockfile";
import { createInternalContext } from "../../src/core/context";

export interface CreateTestContextOptions {
  /**
   * Base path for the store
   * @default "/test"
   */
  basePath?: string;

  /**
   * List of Unicode versions
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
  lockfile?: Lockfile;

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
}

export interface TestContext {
  context: InternalUCDStoreContext;
  fs: FileSystemBridge;
  client: UCDClient;
  basePath: string;
  lockfilePath: string;
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
  const lockfilePath = options?.lockfilePath ?? getLockfilePath(basePath);
  const globalFilters = options?.globalFilters ?? {};

  // Create filesystem with initial files
  const fs = createMemoryMockFS({
    initialFiles: options?.initialFiles,
  });

  // Create client
  const client = options?.client ?? createUCDClientWithConfig(
    options?.baseUrl ?? UCDJS_API_BASE_URL,
    getDefaultUCDEndpointConfig(),
  );

  // Create filter
  const filter = createPathFilter(globalFilters);

  // Write lockfile if provided
  if (options?.lockfile) {
    await writeLockfile(fs, lockfilePath, options.lockfile);
  }

  // Create internal context
  const context = createInternalContext({
    client,
    filter,
    fs,
    basePath,
    versions,
    lockfilePath,
  });

  return {
    context,
    fs,
    client,
    basePath,
    lockfilePath,
  };
}
