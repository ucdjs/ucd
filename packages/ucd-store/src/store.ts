import type { UCDClient, UnicodeVersionFile } from "@ucdjs/fetch";
import type { PathFilter } from "@ucdjs/utils";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import type {
  AnalyzeOptions,
  AnalyzeResult,
  CleanResult,
  RepairOptions,
  StoreCapabilities,
  UCDStoreOptions,
  VersionAnalysis,
} from "./types";
import path from "node:path";
import { invariant, trimLeadingSlash } from "@luxass/utils";
import { joinURL } from "@luxass/utils/path";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createClient, isApiError } from "@ucdjs/fetch";
import { createPathFilter, safeJsonParse } from "@ucdjs/utils";
import defu from "defu";
import { z } from "zod/v4";
import { UCDStoreError, UCDStoreVersionNotFoundError } from "./errors";
import {
  assertCapabilities,
  inferStoreCapabilities,
  requiresCapabilities,
} from "./internal/capabilities";
import { flattenFilePaths } from "./internal/flatten";

const MANIFEST_SCHEMA = z.array(
  z.object({
    version: z.string(),
    path: z.string(),
  }),
);

export class UCDStore {
  /**
   * Base URL for the UCD store API.
   */
  public readonly baseUrl: string;

  /**
   * Base Path attached to the base URL, when accessing files.
   * This is used to resolve file paths when reading from the store.
   */
  public readonly basePath: string;

  #client: UCDClient;
  #filter: PathFilter;
  #fs: FileSystemBridge;
  #versions: string[] = [];
  #manifestPath: string;

  #capabilities: StoreCapabilities = {
    analyze: false,
    clean: false,
    mirror: false,
    repair: false,
  };

  constructor(options: UCDStoreOptions) {
    const { baseUrl, globalFilters, fs, basePath } = defu(options, {
      baseUrl: UCDJS_API_BASE_URL,
      globalFilters: [],
      basePath: "",
    });

    if (fs == null) {
      throw new UCDStoreError("FileSystemBridge instance is required to create a UCDStore.");
    }

    this.baseUrl = baseUrl;
    this.basePath = basePath;
    this.#client = createClient(this.baseUrl);
    this.#filter = createPathFilter(globalFilters);
    this.#fs = fs;
    this.#capabilities = inferStoreCapabilities(this.#fs);

    this.#manifestPath = path.join(this.basePath, ".ucd-store.json");
  }

  /**
   * Gets the filesystem bridge instance used by this store.
   *
   * The filesystem bridge provides an abstraction layer for file system operations,
   * allowing the store to work with different storage backends (local filesystem,
   * remote HTTP, in-memory, etc.) through a unified interface.
   *
   * @returns {FileSystemBridge} The FileSystemBridge instance configured for this store
   */
  get fs(): FileSystemBridge {
    return this.#fs;
  }

  /**
   * Gets the path filter instance used to determine which files should be included or excluded.
   *
   * The filter is configured with global filter patterns during store initialization and is used
   * to filter file paths when retrieving file trees, file paths, and individual files from the store.
   *
   * @returns {PathFilter} The PathFilter instance configured with the store's global filter patterns
   */
  get filter(): PathFilter {
    return this.#filter;
  }

  /**
   * Gets the UCD client instance used for making API requests.
   *
   * @returns {UCDClient} The UCDClient instance configured with the store's base URL
   */
  get client(): UCDClient {
    return this.#client;
  }

  /**
   * Gets the capabilities of this store instance.
   *
   * Capabilities determine what operations the store can perform based on the
   * underlying filesystem bridge's features. This includes operations like
   * mirroring, cleaning, analyzing, and repairing.
   *
   * @returns {StoreCapabilities} A frozen copy of the store's capabilities object
   * to prevent external modification
   */
  get capabilities(): StoreCapabilities {
    return Object.freeze({ ...this.#capabilities });
  }

  /**
   * Initialize the store - loads existing data or creates new structure
   */
  async initialize(): Promise<void> {
    const isValidStore = await this.#fs.exists(this.#manifestPath);

    if (isValidStore) {
      await this.#loadVersionsFromStore();
    } else {
      // If no base path is configured or filesystem doesn't support writing,
      // we can't initialize without existing data
      if (!this.basePath || !this.#capabilities.mirror) {
        throw new UCDStoreError("Store cannot be initialized without existing data. Ensure filesystem supports write operations and base path is configured.");
      }

      if (!this.#versions || this.#versions.length === 0) {
        const { data, error } = await this.#client.GET("/api/v1/unicode-versions");
        if (isApiError(error)) {
          throw new UCDStoreError(`Failed to fetch Unicode versions: ${error.message}`);
        }

        this.#versions = data?.map(({ version }) => version) || [];

        // TODO: maybe we should throw an error if no versions are provided?
        // since it doesn't make sense to create a store without any versions.
      }

      await this.#createNewLocalStore(this.#versions);
    }
  }

  async #loadVersionsFromStore(): Promise<void> {
    try {
      const manifestContent = await this.#fs.read(this.#manifestPath);

      // validate the manifest content
      const jsonData = safeJsonParse(manifestContent);
      if (!jsonData) {
        return;
      }

      // verify that is an array of objects with version and path properties
      const parsedManifest = MANIFEST_SCHEMA.safeParse(jsonData);
      if (!parsedManifest.success) {
        throw new UCDStoreError("Invalid store manifest schema");
      }

      this.#versions = parsedManifest.data.map((entry) => entry.version);
    } catch (error) {
      throw new UCDStoreError(`Failed to load store manifest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async #createNewLocalStore(versions: string[]): Promise<void> {
    invariant(this.#capabilities.mirror, "createNewLocalStore requires mirror capability");
    invariant(this.basePath, "Base path must be set for store creation");

    if (!await this.#fs.exists(this.basePath)) {
      await this.#fs.mkdir(this.basePath);
    }

    // Mirror UCD files from remote to local
    await this.mirror({ versions, overwrite: false, dryRun: false });

    await this.#createStoreManifest(versions);
    this.#versions = [...versions];
  }

  async #createStoreManifest(versions: string[]): Promise<void> {
    invariant(this.#capabilities.mirror, "createStoreManifest requires write capability");
    invariant(this.basePath, "Base path must be set for store creation");

    await this.#writeManifest(versions);
  }

  async getFileTree(version: string, extraFilters?: string[]): Promise<UnicodeVersionFile[]> {
    if (!this.hasVersion(version)) {
      throw new UCDStoreError(`Version '${version}' not found in store`);
    }

    const files = await this.#fs.listdir(path.join(this.basePath, version), true);
    const fileStructure = files.map((file) => ({
      name: path.basename(file.path),
      path: file.path,
      type: file.type === "directory" ? "directory" : "file",
    }));

    return this.#processFileStructure(fileStructure, extraFilters);
  }

  get versions(): readonly string[] {
    // figure out is this have some performance impact
    return Object.freeze([...this.#versions]);
  }

  async getFile(version: string, filePath: string, extraFilters?: string[]): Promise<string> {
    if (!this.hasVersion(version)) {
      throw new UCDStoreError(`Version '${version}' not found in store`);
    }

    if (!this.#filter(trimLeadingSlash(filePath), extraFilters)) {
      throw new UCDStoreError(`File path "${filePath}" is filtered out by the store's filter patterns.`);
    }

    // If we have a base path, try to read from local storage first
    if (this.basePath) {
      const fullPath = path.join(this.basePath, version, filePath);
      return await this.#fs.read(fullPath);
    } else {
      // Read from remote via HTTP filesystem
      return await this.#fs.read(`${version}/${filePath}`);
    }
  }

  hasVersion(version: string): boolean {
    return this.#versions.includes(version);
  }

  async getFilePaths(version: string, extraFilters?: string[]): Promise<string[]> {
    const fileStructure = await this.getFileTree(version, extraFilters);
    return flattenFilePaths(fileStructure);
  }

  #processFileStructure(rawStructure: UnicodeVersionFile[], extraFilters?: string[]): UnicodeVersionFile[] {
    return rawStructure.map((item) => {
      if (!this.#filter(trimLeadingSlash(item.path), extraFilters)) {
        return null;
      }
      return {
        name: item.name,
        path: item.path,
        ...(item.children ? { children: this.#processFileStructure(item.children, extraFilters) } : {}),
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

  @requiresCapabilities()
  async clean(_options: {
    dryRun?: boolean;
    versions?: string[];
  } = {}): Promise<CleanResult> {
    throw new UCDStoreError("Cleaning is not implemented yet.");
  }

  /**
   * Write manifest data to file
   */
  async #writeManifest(versions: string[]): Promise<void> {
    const manifestData = versions.map((version) => ({
      version,
      path: this.basePath ? path.join(this.basePath, version) : version,
    }));

    await this.#fs.write(this.#manifestPath, JSON.stringify(manifestData, null, 2));
  }

  @requiresCapabilities()
  async mirror(options: {
    versions?: string[];
    overwrite?: boolean;
    dryRun?: boolean;
    concurrency?: number;
  } = {}): Promise<{
    success: boolean;
    error?: string;
    mirrored?: string[];
    skipped?: string[];
    failed?: string[];
  }> {
    const {
      versions = [],
      // eslint-disable-next-line unused-imports/no-unused-vars
      overwrite = false,
      // eslint-disable-next-line unused-imports/no-unused-vars
      dryRun = false,
      // eslint-disable-next-line unused-imports/no-unused-vars
      concurrency = 5,
    } = options;

    if (versions?.length === 0) {
      return {
        success: true,
        mirrored: [],
        skipped: [],
        failed: [],
      };
    }

    const mirrored: string[] = [];
    const skipped: string[] = [];
    const failed: string[] = [];

    try {
      return {
        success: failed.length === 0,
        mirrored,
        skipped,
        failed,
      };
    } catch (err) {
      return {
        success: false,
        error: `Mirror operation failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  @requiresCapabilities()
  async repair(options: RepairOptions): Promise<void> {
    const { dryRun } = options;

    const result = await this.analyze({
      checkOrphaned: true,
    });

    throw new UCDStoreError("Repairing is not implemented yet.");
  }

  @requiresCapabilities()
  async analyze(options: AnalyzeOptions): Promise<AnalyzeResult> {
    const {
      checkOrphaned = false,
      versions = this.#versions,
    } = options;

    const versionAnalyses: VersionAnalysis[] = [];

    try {
      const promises = versions.map(async (version) => {
        if (!this.hasVersion(version)) {
          throw new UCDStoreVersionNotFoundError(version);
        }

        return this.#analyzeVersion(version, {
          checkOrphaned,
        });
      });

      await Promise.all(promises);

      return {
        storeHealth: "healthy",
        versions: versionAnalyses,
        totalFiles: 0,
      };
    } catch (err) {
      console.error(`Error during store analysis: ${err instanceof Error ? err.message : String(err)}`);
      return {
        storeHealth: "healthy",
        versions: versionAnalyses,
        totalFiles: 0,
      };
    }
  }

  async #analyzeVersion(version: string, options: Omit<AnalyzeOptions, "versions">): Promise<VersionAnalysis> {
    assertCapabilities("analyze", this.#fs);
    const { checkOrphaned } = options;

    // get the expected files for this version
    const expectedFiles = await this.#getExpectedFilePaths(version);

    // // get the actual files from the store
    const actualFiles = await this.getFilePaths(version);

    const orphanedFiles: string[] = [];
    const missingFiles: string[] = [];

    if (checkOrphaned) {
      for (const file of actualFiles) {
        // if file is not in expected files, it's orphaned
        if (!expectedFiles.includes(file)) {
          orphanedFiles.push(file);
        }
      }
    }

    const isComplete = orphanedFiles.length === 0 && missingFiles.length === 0;
    return {
      version,
      orphanedFiles,
      missingFiles,
      totalFileCount: expectedFiles.length,
      fileCount: actualFiles.length,
      isComplete,
    };
  }

  /**
   * Retrieves the expected file paths for a specific Unicode version from the API.
   *
   * This method fetches the canonical list of files that should exist for a given
   * Unicode version by making an API call to the UCD service. The returned file
   * paths represent the complete set of files that should be present in a properly
   * synchronized store for the specified version.
   *
   * @param {string} version - The Unicode version to get expected file paths for
   * @returns {Promise<string[]>} A promise that resolves to an array of file paths that should exist for the version
   * @throws {UCDStoreVersionNotFoundError} When the specified version is not found in the store
   * @throws {UCDStoreError} When the API request fails or returns an error
   * @private
   */
  async #getExpectedFilePaths(version: string): Promise<string[]> {
    if (!this.hasVersion(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    // fetch the expected files for this version from the API
    const { data, error } = await this.#client.GET("/api/v1/files/{version}", {
      params: {
        path: {
          version,
        },
      },
    });

    if (isApiError(error)) {
      throw new UCDStoreError(`Failed to fetch expected files for version '${version}': ${error.message}`);
    }

    return flattenFilePaths(data!, `/${version}`);
  }
}
