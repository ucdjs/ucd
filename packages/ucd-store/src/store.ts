import type { PathFilter } from "@ucdjs/utils";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createClient } from "@ucdjs/fetch";
import { createPathFilter } from "@ucdjs/utils";
import defu from "defu";

type StoreMode = "remote" | "local";

export interface UCDStoreOptions {
  /**
   * Base URL for the Unicode API
   *
   * @default "https://api.ucdjs.dev/api/v1"
   */
  baseUrl?: string;

  /**
   * Optional filters to apply when fetching Unicode data.
   * These can be used to limit the data fetched from the API.
   */
  globalFilters?: string[];

  /**
   * The mode of the UCD store.
   */
  mode: StoreMode;

  /**
   * Base path for local store (only used in local mode)
   */
  basePath?: string;

  /**
   * Versions to initialize with (only used in local mode for new stores)
   */
  versions?: string[];
}

export type AnalyzeResult = {
  success: true;
  totalFiles: number;
  versions: {
    version: string;
    fileCount: number;
    isComplete: boolean;
  }[];
} | {
  success: false;
  error: string;
};

export type CleanResult = {
  success: true;
  removedFiles: string[];
  deletedCount: number;
} | {
  success: false;
  error: string;
};

export class UCDStore {
  public readonly baseUrl: string;
  public readonly mode: StoreMode;
  public readonly basePath?: string;
  private readonly providedVersions?: string[];
  private loadedVersions: string[] = [];
  private client: ReturnType<typeof createClient>;
  private filter: PathFilter;

  constructor(options: UCDStoreOptions) {
    const { baseUrl, globalFilters, mode, basePath, versions } = defu(options, {
      baseUrl: UCDJS_API_BASE_URL,
      globalFilters: [],
      mode: "remote" as StoreMode,
      basePath: "./ucd-files",
      versions: UNICODE_VERSION_METADATA.filter((v) => v.status === "stable").map((v) => v.version),
    });

    this.mode = mode;
    this.baseUrl = baseUrl;
    this.basePath = basePath;
    this.providedVersions = versions;
    this.client = createClient(this.baseUrl);
    this.filter = createPathFilter(globalFilters);
  }
}
