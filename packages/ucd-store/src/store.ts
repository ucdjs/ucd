import type { UnicodeVersionFile } from "@luxass/unicode-utils-new/fetch";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import path from "node:path";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { createClient } from "@luxass/unicode-utils-new/fetch";
import { promiseRetry } from "@luxass/utils";
import { createPathFilter, type FilterFn } from "@ucdjs/utils";
import { flattenFilePaths } from "@ucdjs/utils/ucd-files";
import defu from "defu";

type StoreMode = "remote" | "local";

export interface UCDStoreOptions {
  /**
   * Base URL for the Unicode API
   *
   * @default "https://unicode-api.luxass.dev/api/v1"
   */
  baseUrl?: string;

  /**
   * Proxy URL for the Unicode API
   *
   * @default "https://unicode-proxy.ucdjs.dev"
   */
  proxyUrl?: string;

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

export const DEFAULT_BASE_URL = "https://unicode-api.luxass.dev/api/v1";
export const DEFAULT_PROXY_URL = "https://unicode-proxy.ucdjs.dev";

export class UCDStore {
  public readonly baseUrl: string;
  public readonly proxyUrl: string;
  public readonly mode: StoreMode;
  public readonly basePath?: string;
  private readonly providedVersions?: string[];
  private loadedVersions: string[] = [];
  private client: ReturnType<typeof createClient>;
  private filter: FilterFn;
  #fs: FileSystemBridge;

  constructor(options: UCDStoreOptions) {
    const { baseUrl, globalFilters, mode, proxyUrl, fs, basePath, versions } = defu(options, {
      baseUrl: DEFAULT_BASE_URL,
      proxyUrl: DEFAULT_PROXY_URL,
      globalFilters: [],
      mode: "remote" as StoreMode,
      basePath: "./ucd-files",
    });

    this.mode = mode;
    this.baseUrl = baseUrl;
    this.proxyUrl = proxyUrl;
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
    if (this.mode === "local") {
      await this.initializeLocalStore();
    } else {
      await this.initializeRemoteStore();
    }
  }

  private async initializeLocalStore(): Promise<void> {
    if (!this.basePath) {
      throw new Error("Base path is required for local mode");
    }

    const storeManifestPath = path.join(this.basePath, ".ucd-store.json");
    const isValidStore = await this.#fs.exists(this.basePath) && await this.#fs.exists(storeManifestPath);

    if (isValidStore) {
      // Load versions from existing store
      await this.loadVersionsFromStore();
    } else {
      // Initialize new store
      if (!this.providedVersions || this.providedVersions.length === 0) {
        throw new Error("No versions provided for initializing new local store");
      }
      await this.createNewLocalStore(this.providedVersions);
    }
  }

  private async initializeRemoteStore(): Promise<void> {
    // For remote store, just populate available versions
    this.loadedVersions = UNICODE_VERSION_METADATA.map((v) => v.version);
  }

  private async loadVersionsFromStore(): Promise<void> {
    if (!this.basePath) return;

    const storeManifestPath = path.join(this.basePath, ".ucd-store.json");
    try {
      const manifestContent = await this.#fs.read(storeManifestPath);
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
    if (!this.basePath) return;

    const storeManifestPath = path.join(this.basePath, ".ucd-store.json");
    const manifestData = versions.map((version) => ({
      version,
      path: path.join(this.basePath!, version),
    }));

    await this.#fs.write(storeManifestPath, JSON.stringify(manifestData, null, 2));
  }

  async getFileTree(version: string): Promise<UnicodeVersionFile[]> {
    if (!this.hasVersion(version)) {
      throw new Error(`Version '${version}' not found in store`);
    }

    if (this.mode === "remote") {
      const { data, error } = await promiseRetry(async () => {
        return await this.client.GET("/api/v1/unicode-files/{version}", {
          params: { path: { version } },
        });
      }, { retries: 3 });

      if (error) {
        throw new Error(`Failed to fetch file structure for version "${version}": ${error.message}`);
      }

      return this.processFileStructure(data);
    } else {
      // For local mode, read directory structure
      if (!this.basePath) {
        throw new Error("Base path not set for local mode");
      }

      const versionPath = path.join(this.basePath, version);
      const files = await this.#fs.listdir(versionPath, true);

      return files.map((file) => ({
        name: path.basename(file),
        path: file,
      }));
    }
  }

  get versions(): string[] {
    return [...this.loadedVersions];
  }

  async getFile(version: string, filePath: string): Promise<string> {
    if (!this.hasVersion(version)) {
      throw new Error(`Version '${version}' not found in store`);
    }

    if (!this.filter(filePath)) {
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

  async getFilePaths(version: string): Promise<string[]> {
    const fileStructure = await this.getFileTree(version);
    return flattenFilePaths(fileStructure);
  }

  private processFileStructure(rawStructure: UnicodeVersionFile[]): UnicodeVersionFile[] {
    return rawStructure.map((item) => {
      if (!this.filter(item.path)) {
        return null;
      }
      return {
        name: item.name,
        path: item.path,
        ...(item.children ? { children: this.processFileStructure(item.children) } : {}),
      };
    }).filter((item): item is UnicodeVersionFile => item != null);
  }

  async getAllFiles(): Promise<string[]> {
    const allFiles: string[] = [];
    for (const version of this.versions) {
      const files = await this.getFilePaths(version);
      allFiles.push(...files.map((file) => `${version}/${file}`));
    }
    return allFiles;
  }

  async clean(): Promise<CleanResult> {
    throw new Error("Clean method not implemented yet");
  }

  async analyze(): Promise<AnalyzeResult> {
    const allFiles = await this.getAllFiles();
    return {
      success: true,
      totalFiles: allFiles.length,
      versions: this.versions.map((version) => ({
        version,
        fileCount: 0,
        isComplete: false,
      })),
    };
  }
}

/**
 * Creates a new UCD store instance with the specified options.
 *
 * @param {UCDStoreOptions} options - Configuration options for the UCD store
 * @returns {Promise<UCDStore>} A fully initialized UCDStore instance
 */
export async function createUCDStore(options: UCDStoreOptions): Promise<UCDStore> {
  return new UCDStore(options);
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

  return new UCDStore({
    mode: "local",
    fs,
    ...options,
  });
}

export type RemoteUCDStoreOptions = Omit<UCDStoreOptions, "mode" | "fs"> & {
  fs?: FileSystemBridge;
};

export async function createRemoteUCDStore(options: RemoteUCDStoreOptions): Promise<UCDStore> {
  const fs = options.fs || await import("@ucdjs/utils/fs-bridge/node").then((m) => m.default);

  if (!fs) {
    throw new Error("FileSystemBridge is required for remote UCD store");
  }

  return new UCDStore({
    mode: "remote",
    fs,
    ...options,
  });
}
