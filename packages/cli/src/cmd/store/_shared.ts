export interface CLIStoreCmdSharedFlags {
  storeDir?: string;
  remote?: boolean;
  patterns?: string[];

  baseUrl?: string;
  proxyUrl?: string;
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
