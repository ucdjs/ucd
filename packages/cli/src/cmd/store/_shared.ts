import type { UCDStore, UCDStoreOptions } from "@ucdjs/ucd-store";
import type { Readable, Writable } from "node:stream";
import { isCancel, multiselect } from "@clack/prompts";
import { createUCDClient } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createHTTPUCDStore, createNodeUCDStore, UCDStoreBaseError, validateVersions } from "@ucdjs/ucd-store";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import {
  CLIError,
  CLIStoreError,
  RemoteNotSupportedError,
  StoreConfigurationError,
  StoreDirIsRequiredError,
} from "../../errors";

export interface CLIStoreCmdSharedFlags {
  storeDir?: string;
  remote?: boolean;
  include?: string[];
  exclude?: string[];
  baseUrl?: string;
  versions?: string[];
  force?: boolean;
  requireExistingStore?: boolean;
  versionStrategy?: "strict" | "merge" | "overwrite";
}

/**
 * Shared flags for all store commands (filtering, API config)
 */
export const SHARED_FLAGS = [
  ["--include", "Patterns to include files in the store."],
  ["--exclude", "Patterns to exclude files from the store."],
  ["--base-url", "Base URL for the UCD API."],
  ["--force", "Force operation (command-specific behavior)."],
] as [string, string][];

/**
 * Flags specific to local store commands (init, sync, mirror)
 */
export const LOCAL_STORE_FLAGS = [
  ["--store-dir", "Directory where the UCD files are stored. (required)"],
] as [string, string][];

/**
 * Flags for commands that work with both local and remote stores
 */
export const REMOTE_CAPABLE_FLAGS = [
  ["--store-dir", "Directory where the UCD files are stored."],
  ["--remote", "Use a Remote UCD Store (read-only)."],
] as [string, string][];

/**
 * Asserts that storeDir is provided. Used for local-only commands (init, sync, mirror).
 */
export function assertLocalStore(flags: CLIStoreCmdSharedFlags): asserts flags is CLIStoreCmdSharedFlags & { storeDir: string } {
  if (flags.remote) {
    throw new RemoteNotSupportedError();
  }

  if (!flags.storeDir) {
    throw new StoreDirIsRequiredError();
  }

  void 0;
}

export function assertRemoteOrStoreDir(flags: CLIStoreCmdSharedFlags): asserts flags is CLIStoreCmdSharedFlags & { remote: true } | { storeDir: string } {
  if (!flags.remote && !flags.storeDir) {
    throw new StoreConfigurationError("Either --remote or --store-dir must be specified.");
  }

  void 0;
}

/**
 * Validates that the provided versions exist in the API.
 * Throws a CLIError if any versions are invalid.
 *
 * @param versions - Versions to validate
 * @param baseUrl - Base URL for the UCD API
 * @throws {CLIError} If any versions are invalid
 */
export async function validateVersionsOrThrow(versions: string[], baseUrl?: string): Promise<void> {
  if (!versions || versions.length === 0) {
    return;
  }

  const client = await createUCDClient(baseUrl || UCDJS_API_BASE_URL);

  try {
    const result = await validateVersions({ client, versions });

    if (!result.valid) {
      throw new CLIError(
        `Invalid Unicode version(s): ${result.invalidVersions.join(", ")}`,
        {
          title: "Version Validation Error",
          details: [
            `Available versions: ${result.availableVersions.join(", ")}`,
          ],
        },
      );
    }
  } catch (err) {
    if (err instanceof CLIError) {
      throw err;
    }

    // Wrap other errors
    if (err instanceof Error) {
      throw new CLIStoreError(err);
    }

    throw err;
  }
}

/**
 * Creates a UCD store instance based on the provided CLI flags.
 * Validates versions before creating the store.
 *
 * @param {CLIStoreCmdSharedFlags} flags - Configuration flags for creating the store
 * @returns {Promise<UCDStore>} A promise that resolves to a UCDStore instance
 * @throws {CLIStoreError} When store creation fails
 * @throws {StoreDirIsRequiredError} When store directory is not specified for local stores
 * @throws {CLIError} When version validation fails
 */
export async function createStoreFromFlags(flags: CLIStoreCmdSharedFlags): Promise<UCDStore> {
  const {
    storeDir,
    remote,
    baseUrl,
    include,
    exclude,
    force,
    requireExistingStore,
    versionStrategy,
  } = flags;

  // Validate versions before creating the store
  if (flags.versions && flags.versions.length > 0) {
    await validateVersionsOrThrow(flags.versions, baseUrl);
  }

  const options = {
    baseUrl,
    globalFilters: {
      include,
      exclude,
    },
    versionStrategy: force ? "overwrite" : (versionStrategy || "strict"),
    requireExistingStore,
  } satisfies Partial<UCDStoreOptions>;

  try {
    if (remote) {
      return await createHTTPUCDStore(options);
    }

    if (!storeDir) {
      throw new StoreDirIsRequiredError();
    }

    return await createNodeUCDStore({
      ...options,
      basePath: storeDir,
      versions: flags.versions || [],
    });
  } catch (err) {
    if (err instanceof UCDStoreBaseError) {
      throw new CLIStoreError(err);
    }

    throw err;
  }
}

export interface RunVersionPromptOptions {
  input?: Readable;
  output?: Writable;
}

export async function runVersionPrompt({
  input,
  output,
}: RunVersionPromptOptions = {}): Promise<string[]> {
  const selectedVersions = await multiselect({
    options: UNICODE_VERSION_METADATA.map(({ version }) => ({
      value: version as string,
      label: version,
    })),
    message: "Select Unicode versions to initialize the store with:",
    required: true,
    input,
    output,
  });

  if (isCancel(selectedVersions)) {
    return [];
  }

  return selectedVersions;
}
