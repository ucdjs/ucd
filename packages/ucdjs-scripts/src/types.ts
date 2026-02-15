import type { ExpectedFile } from "@ucdjs/schemas";

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

export interface SetupDevOptions extends GlobalOptions {
  versions?: string;
  batchSize?: number;
}

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

export interface UploadResult {
  success: boolean;
  uploaded: number;
  skipped: number;
  errors: Array<{ version: string; reason: string }>;
  versions: Array<{ version: string; fileCount: number }>;
}

export interface TaskUploadQueuedResult {
  success: boolean;
  workflowId: string;
  status: string;
  statusUrl: string;
}

export interface TaskUploadStatusResult {
  workflowId: string;
  status: string;
  output?: {
    success?: boolean;
    version?: string;
    filesUploaded?: number;
    duration?: number;
    workflowId?: string;
  };
  error?: string;
}

export interface UploadOptions {
  baseUrl: string;
  taskKey?: string;
}
