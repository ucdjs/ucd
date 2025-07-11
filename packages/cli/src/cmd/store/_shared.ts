import type { UCDStore } from "@ucdjs/ucd-store";
import { createHTTPUCDStore, createNodeUCDStore } from "@ucdjs/ucd-store";

export interface CLIStoreCmdSharedFlags {
  storeDir?: string;
  remote?: boolean;
  patterns?: string[];
  baseUrl?: string;
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

export async function createStoreFromFlags(flags: CLIStoreCmdSharedFlags): Promise<UCDStore | null> {
  const { storeDir, remote, baseUrl, patterns } = flags;

  if (remote) {
    return createHTTPUCDStore({
      baseUrl,
      globalFilters: patterns,
    });
  } else {
    return createNodeUCDStore({
      basePath: storeDir,
      baseUrl,
      globalFilters: patterns,
    });
  }
}
