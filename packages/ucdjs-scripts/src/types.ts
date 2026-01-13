import type { ExpectedFile } from "@ucdjs/schemas";

// =============================================================================
// CLI Option Types
// =============================================================================

export interface GlobalOptions {
  logLevel?: string;
}

export interface RefreshManifestsOptions extends GlobalOptions {
  env?: string;
  baseUrl?: string;
  setupKey?: string;
  versions?: string;
  dryRun?: boolean;
  batchSize?: number;
}

export interface SetupDevOptions extends GlobalOptions {
  versions?: string;
  batchSize?: number;
}

// =============================================================================
// Manifest Types
// =============================================================================

export interface UnicodeVersion {
  version: string;
  mappedUcdVersion?: string;
}

export interface GeneratedManifest {
  version: string;
  manifest: { expectedFiles: ExpectedFile[] };
  fileCount: number;
}

export interface GenerateManifestsOptions {
  versions?: string[];
  apiBaseUrl?: string;
  batchSize?: number;
}

// =============================================================================
// Upload Types
// =============================================================================

export interface UploadResult {
  success: boolean;
  uploaded: number;
  skipped: number;
  errors: Array<{ version: string; reason: string }>;
  versions: Array<{ version: string; fileCount: number }>;
}

export interface UploadOptions {
  baseUrl: string;
  setupKey?: string;
  dryRun?: boolean;
}
