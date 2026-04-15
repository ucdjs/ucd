import type { ExpectedFile, Snapshot, UnicodeVersionType } from "@ucdjs/schemas";

export interface GlobalOptions {
  logLevel?: string;
}

export interface RefreshManifestsOptions extends GlobalOptions {
  env?: string;
  baseUrl?: string;
  taskKey?: string;
  versions?: string;
  dryRun?: boolean;
  batchSize?: number;
}

export interface ReindexVersionsOptions extends GlobalOptions {
  env?: string;
  baseUrl?: string;
  taskKey?: string;
  versions?: string;
}

export interface SetupDevOptions extends GlobalOptions {
  versions?: string;
  batchSize?: number;
}

export interface UnicodeVersion {
  version: string;
  date?: string | null;
  mappedUcdVersion?: string;
  status?: UnicodeVersionType;
  type?: UnicodeVersionType;
}

export interface GeneratedManifest {
  version: string;
  date: string | null;
  status: UnicodeVersionType;
  manifest: { expectedFiles: ExpectedFile[] };
  snapshot: Snapshot;
  fileCount: number;
}

export interface GenerateManifestsOptions {
  versions?: string[];
  upstreamVersions?: UnicodeVersion[];
  apiBaseUrl?: string;
  batchSize?: number;
}

export interface UploadResult {
  success: boolean;
  uploaded: number;
  skipped: number;
  errors: Array<{ version: string; reason: string }>;
  versions: Array<{ version: string; date: string | null; status: UnicodeVersionType; fileCount: number }>;
}
