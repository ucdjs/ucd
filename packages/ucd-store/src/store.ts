import type { UnicodeVersionFile } from "@ucdjs/fetch";
import type { PathFilter } from "@ucdjs/utils";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import path from "node:path";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { promiseRetry } from "@luxass/utils";
import { UCDJS_API_BASE_URL, UNICODE_PROXY_URL } from "@ucdjs/env";
import { createClient } from "@ucdjs/fetch";
import { createPathFilter } from "@ucdjs/utils";
import { flattenFilePaths } from "@ucdjs/utils/ucd-files";
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

  /**
   * File System Bridge to use for file operations.
   * You can either provide your own implementation or use one of the following:
   * - `@ucdjs/utils/fs-bridge/node` for Node.js environments
   * - `@ucdjs/utils/fs-bridge/http` for HTTP-based file systems (e.g., for remote stores)
   */
  fs: FileSystemBridge;
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
  #fs: FileSystemBridge;

  constructor(options: UCDStoreOptions) {
    const { baseUrl, globalFilters, mode, fs, basePath, versions } = defu(options, {
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
    this.#fs = fs;
  }

  /**
   * Initialize the store - loads existing data or creates new structure
   */
  async initialize(): Promise<void> {
    const manifestPath = this.getManifestPath();

    // Check if store already exists
    const isValidStore = this.mode === "local"
      ? await this.#fs.exists(this.basePath!) && await this.#fs.exists(manifestPath)
      : await this.#fs.exists(manifestPath);

    if (isValidStore) {
      // Load versions from existing store
      await this.loadVersionsFromStore();
    } else {
      // Initialize new store
      if (this.mode === "local") {
        if (!this.providedVersions || this.providedVersions.length === 0) {
          throw new Error("No versions provided for initializing new local store");
        }
        await this.createNewLocalStore(this.providedVersions);
      } else {
        // console.debug("[UCDStore] Initializing remote store, no local files will be created.");
        // For remote store, just populate available versions
        this.loadedVersions = UNICODE_VERSION_METADATA.map((v) => v.version);
      }
    }
  }

  /**
   * Get the appropriate manifest path based on store mode
   */
  private getManifestPath(): string {
    return this.mode === "local"
      ? path.join(this.basePath!, ".ucd-store.json")
      : ".ucd-store.json";
  }

  private async loadVersionsFromStore(): Promise<void> {
    const manifestPath = this.getManifestPath();

    try {
      const manifestContent = await this.#fs.read(manifestPath);
      const manifestData = JSON.parse(manifestContent);
      this.loadedVersions = manifestData.map((entry: any) => entry.version);
    } catch (error) {
      throw new Error(`Failed to load store manifest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createNewLocalStore(versions: string[]): Promise<void> {
    if (!this.basePath) return;

    // await this.#fs.ensureDir(this.basePath);

    // TODO: Implement actual file mirroring
    // await mirrorUCDFiles({
    //   versions,
    //   basePath: this.basePath,
    //   fs: this.#fs,
    //   patternMatcher: this.#filter,
    // });

    await this.createStoreManifest(versions);
    this.loadedVersions = [...versions];
  }

  private async createStoreManifest(versions: string[]): Promise<void> {
    const manifestPath = this.getManifestPath();
    const manifestData = versions.map((version) => ({
      version,
      path: this.mode === "local" ? path.join(this.basePath!, version) : version,
    }));

    await this.#fs.write(manifestPath, JSON.stringify(manifestData, null, 2));
  }

  async getFileTree(version: string, extraFilters?: string[]): Promise<UnicodeVersionFile[]> {
    if (!this.hasVersion(version)) {
      throw new Error(`Version '${version}' not found in store`);
    }

    if (this.mode === "remote") {
      const { data, error } = await promiseRetry(async () => {
        return await this.client.GET("/api/v1/files/{version}", {
          params: { path: { version } },
        });
      }, { retries: 3 });

      if (error) {
        throw new Error(`Failed to fetch file structure for version "${version}": ${error.message}`);
      }

      return this.processFileStructure(data, extraFilters);
    } else {
      // For local mode, read directory structure
      if (!this.basePath) {
        throw new Error("Base path not set for local mode");
      }

      const versionPath = path.join(this.basePath, version);
      const files = await this.#fs.listdir(versionPath, true);

      const fileStructure = files.map((file) => ({
        name: path.basename(file),
        path: file,
      }));

      return this.processFileStructure(fileStructure, extraFilters);
    }
  }

  get versions(): string[] {
    return [...this.loadedVersions];
  }

  async getFile(version: string, filePath: string, extraFilters?: string[]): Promise<string> {
    if (!this.hasVersion(version)) {
      throw new Error(`Version '${version}' not found in store`);
    }

    if (!this.filter(filePath, extraFilters)) {
      throw new Error(`File path "${filePath}" is filtered out by the store's filter patterns.`);
    }

    if (this.mode === "remote") {
      // HTTP filesystem handles the caching and fetching
      return await this.#fs.read(`${version}/${filePath}`);
    } else {
      // Local filesystem
      if (!this.basePath) {
        throw new Error("Base path not set for local mode");
      }

      const fullPath = path.join(this.basePath, version, filePath);
      return await this.#fs.read(fullPath);
    }
  }

  hasVersion(version: string): boolean {
    return this.loadedVersions.includes(version);
  }

  async getFilePaths(version: string, extraFilters?: string[]): Promise<string[]> {
    const fileStructure = await this.getFileTree(version, extraFilters);
    return flattenFilePaths(fileStructure);
  }

  private processFileStructure(rawStructure: UnicodeVersionFile[], extraFilters?: string[]): UnicodeVersionFile[] {
    return rawStructure.map((item) => {
      if (!this.filter(item.path, extraFilters)) {
        return null;
      }
      return {
        name: item.name,
        path: item.path,
        ...(item.children ? { children: this.processFileStructure(item.children, extraFilters) } : {}),
      };
    }).filter((item): item is UnicodeVersionFile => item != null);
  }

  async getAllFiles(extraFilters?: string[]): Promise<string[]> {
    const allFiles: string[] = [];
    for (const version of this.versions) {
      const files = await this.getFilePaths(version, extraFilters);
      allFiles.push(...files.map((file) => `${version}/${file}`));
    }
    return allFiles;
  }

  async clean(): Promise<CleanResult> {
    throw new Error("Clean method not implemented yet");
  }

  async analyze(): Promise<AnalyzeResult> {
    throw new Error("Analyze method not implemented yet");
  }
}

/**
 * Creates a new UCD store instance with the specified options.
 *
 * @param {UCDStoreOptions} options - Configuration options for the UCD store
 * @returns {Promise<UCDStore>} A fully initialized UCDStore instance
 */
export async function createUCDStore(options: UCDStoreOptions): Promise<UCDStore> {
  const store = new UCDStore(options);

  await store.initialize();

  return store;
}

export type LocalUCDStoreOptions = Omit<UCDStoreOptions, "mode" | "fs"> & {
  fs?: FileSystemBridge;
};

/**
 * Creates a new UCD store instance configured for local file system access.
 *
 * This function simplifies the creation of a local UCD store by:
 * - Setting the mode to "local" automatically
 * - Loading the Node.js file system bridge if not provided
 * - Initializing the store with the specified options
 *
 * @param {LocalUCDStoreOptions} options - Configuration options for the local UCD store
 * @returns {Promise<UCDStore>} A fully initialized local UCDStore instance
 */
export async function createLocalUCDStore(options: LocalUCDStoreOptions): Promise<UCDStore> {
  const fs = options.fs || await import("@ucdjs/utils/fs-bridge/node").then((m) => m.default);

  if (!fs) {
    throw new Error("FileSystemBridge is required for local UCD store");
  }

  const store = new UCDStore({
    mode: "local",
    fs,
    ...options,
  });

  await store.initialize();

  return store;
}

export type RemoteUCDStoreOptions = Omit<UCDStoreOptions, "mode" | "fs"> & {
  fs?: FileSystemBridge;
};

export async function createRemoteUCDStore(options: RemoteUCDStoreOptions): Promise<UCDStore> {
  const fs = options.fs || await import("@ucdjs/utils/fs-bridge/http").then((m) => m.default);

  if (!fs) {
    throw new Error("FileSystemBridge is required for remote UCD store");
  }

  const store = new UCDStore({
    mode: "remote",
    fs: typeof fs === "function"
      ? fs({
          baseUrl: options.baseUrl || UNICODE_PROXY_URL,
        })
      : fs,
    ...options,
  });

  await store.initialize();

  return store;
}
