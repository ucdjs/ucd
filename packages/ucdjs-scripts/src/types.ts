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
