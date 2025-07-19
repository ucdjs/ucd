import type { UCDStore } from "@ucdjs/ucd-store";
import { isCancel, MultiSelectPrompt, TextPrompt } from "@clack/core";

import { multiselect } from "@clack/prompts";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils";
import { createHTTPUCDStore, createNodeUCDStore } from "@ucdjs/ucd-store";
import color from "farver";

export interface CLIStoreCmdSharedFlags {
  storeDir?: string;
  remote?: boolean;
  patterns?: string[];
  baseUrl?: string;
  versions?: string[];
}

export const SHARED_FLAGS = [
  ["--remote", "Use a Remote UCD Store."],
  ["--store-dir", "Directory where the UCD files are stored."],
  ["--patterns", "Patterns to filter files in the store."],
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
export async function createStoreFromFlags(flags: CLIStoreCmdSharedFlags): Promise<UCDStore | null> {
  const { storeDir, remote, baseUrl, patterns } = flags;

  if (remote) {
    return createHTTPUCDStore({
      baseUrl,
      globalFilters: patterns,
    });
  }

  if (!storeDir) {
    throw new Error("Store directory must be specified when not using remote store.");
  }

  return createNodeUCDStore({
    basePath: storeDir,
    baseUrl,
    globalFilters: patterns,
    versions: flags.versions || [],
  });
}

export async function runVersionPrompt(): Promise<string[]> {
  const selectedVersions = await multiselect({
    options: UNICODE_VERSION_METADATA.map(({ version }) => ({
      value: version,
      label: version,
    })),
    message: "Select Unicode versions to initialize the store with:",
    required: true,
  });

  if (isCancel(selectedVersions)) {
    return [];
  }

  return selectedVersions;
}
