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
