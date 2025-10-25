import type { UCDStore } from "@ucdjs/ucd-store";
import type { Readable, Writable } from "node:stream";
import { isCancel, multiselect } from "@clack/prompts";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils";
import { createHTTPUCDStore, createNodeUCDStore } from "@ucdjs/ucd-store";

export interface CLIStoreCmdSharedFlags {
  storeDir?: string;
  remote?: boolean;
  include?: string[];
  exclude?: string[];
  baseUrl?: string;
  versions?: string[];
}

export const SHARED_FLAGS = [
  ["--remote", "Use a Remote UCD Store."],
  ["--store-dir", "Directory where the UCD files are stored."],
  ["--include", "Patterns to include files in the store."],
  ["--exclude", "Patterns to exclude files from the store."],
  ["--base-url", "Base URL for the UCD Store."],
] as [string, string][];

export function assertRemoteOrStoreDir(flags: CLIStoreCmdSharedFlags): asserts flags is CLIStoreCmdSharedFlags & { remote: true } | { storeDir: string } {
  if (!flags.remote && !flags.storeDir) {
    throw new Error("Either --remote or --store-dir must be specified.");
  }
}

/**
 * Creates a UCD store instance based on the provided CLI flags.
 *
 * @param {CLIStoreCmdSharedFlags} flags - Configuration flags for creating the store
 * @returns {Promise<UCDStore | null>} A promise that resolves to a UCDStore instance or null
 * @throws {Error} When store directory is not specified for local stores
 */
export async function createStoreFromFlags(flags: CLIStoreCmdSharedFlags): Promise<UCDStore> {
  const { storeDir, remote, baseUrl, include, exclude } = flags;

  if (remote) {
    return createHTTPUCDStore({
      baseUrl,
      globalFilters: {
        include,
        exclude,
      },
    });
  }

  if (!storeDir) {
    throw new Error("Store directory must be specified when not using remote store.");
  }

  return createNodeUCDStore({
    basePath: storeDir,
    baseUrl,
    globalFilters: {
      include,
      exclude,
    },
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
