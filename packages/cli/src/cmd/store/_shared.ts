import type { UCDStore, UCDStoreOptions } from "@ucdjs/ucd-store";
import type { Readable, Writable } from "node:stream";
import { isCancel, multiselect } from "@clack/prompts";
import { createHTTPUCDStore, createNodeUCDStore } from "@ucdjs/ucd-store";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { red } from "farver/fast";
import { output } from "../../output";

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
  ["--lockfile-only", "Read-only mode: only read lockfile, never update it."],
] as [string, string][];

/**
 * Asserts that storeDir is provided. Used for local-only commands (init, sync, mirror).
 */
export function assertLocalStore(flags: CLIStoreCmdSharedFlags): asserts flags is CLIStoreCmdSharedFlags & { storeDir: string } {
  if (flags.remote) {
    output.error(red(`\n❌ Store Error:`));
    output.error(`  The --remote flag is not supported for this command.`);
    output.error("Please check the store configuration and try again.");
    output.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
    return;
  }

  if (!flags.storeDir) {
    output.error(red(`\n❌ Store Error:`));
    output.error(`  --store-dir is required. Please specify the directory where the UCD files should be stored.`);
    output.error("Please check the store configuration and try again.");
    output.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
    return;
  }

  void 0;
}

export function assertRemoteOrStoreDir(flags: CLIStoreCmdSharedFlags): asserts flags is CLIStoreCmdSharedFlags & { remote: true } | { storeDir: string } {
  if (!flags.remote && !flags.storeDir) {
    output.error(red(`\n❌ Store Error:`));
    output.error(`  Either --remote or --store-dir must be specified.`);
    output.error("Please check the store configuration and try again.");
    output.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
    return;
  }

  void 0;
}

/**
 * Creates a UCD store instance based on the provided CLI flags.
 *
 * @param {CLIStoreCmdSharedFlags} flags - Configuration flags for creating the store
 * @returns {Promise<UCDStore>} A promise that resolves to a UCDStore instance
 * @throws {Error} When store directory is not specified for local stores
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

  const options = {
    baseUrl,
    globalFilters: {
      include,
      exclude,
    },
    versionStrategy: force ? "overwrite" : (versionStrategy || "strict"),
    requireExistingStore,
  } satisfies Partial<UCDStoreOptions>;

  if (remote) {
    return createHTTPUCDStore(options);
  }

  if (!storeDir) {
    throw new Error("Store directory must be specified when not using remote store.");
  }

  return createNodeUCDStore({
    ...options,
    basePath: storeDir,
    versions: flags.versions || [],
  });
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
