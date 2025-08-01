import type { UCDClient, UnicodeTreeNode } from "@ucdjs/fetch";
import type { FileSystemBridgeOperationsWithSymbol } from "@ucdjs/fs-bridge";
import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { PathFilter } from "@ucdjs/utils";
import type { AnalyzeOptions, StoreCapabilities, UCDStoreOptions, VersionAnalysis } from "./types";
import { invariant, prependLeadingSlash, trimLeadingSlash } from "@luxass/utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createClient, isApiError } from "@ucdjs/fetch";
import { UCDStoreManifestSchema } from "@ucdjs/schemas";
import { createPathFilter, flattenFilePaths, safeJsonParse } from "@ucdjs/utils";
import defu from "defu";
import { join } from "pathe";
import { UCDStoreError, UCDStoreVersionNotFoundError } from "./errors";
import { assertCapabilities, inferStoreCapabilities } from "./internal/capabilities";
import { getExpectedFilePaths } from "./internal/files";

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
  #fs: FileSystemBridgeOperationsWithSymbol;
  #versions: string[] = [];
  #manifestPath: string;

  #capabilities: StoreCapabilities = {
    analyze: false,
    clean: false,
    mirror: false,
    repair: false,
  };

  constructor(options: UCDStoreOptions) {
    const { baseUrl, globalFilters, fs, basePath, versions } = defu(options, {
      baseUrl: UCDJS_API_BASE_URL,
      globalFilters: [],
      basePath: "",
      versions: [],
    });

    if (fs == null) {
      throw new UCDStoreError("FileSystemBridge instance is required to create a UCDStore.");
    }

    this.baseUrl = baseUrl;
    this.basePath = basePath;
    this.#client = createClient(this.baseUrl);
    this.#filter = createPathFilter(globalFilters);
    this.#fs = fs as FileSystemBridgeOperationsWithSymbol;
    this.#capabilities = inferStoreCapabilities(this.#fs);
    this.#versions = versions;

    this.#manifestPath = join(this.basePath, ".ucd-store.json");
  }

  /**
   * Gets the filesystem bridge instance used by this store.
   *
   * The filesystem bridge provides an abstraction layer for file system operations,
   * allowing the store to work with different storage backends (local filesystem,
   * remote HTTP, in-memory, etc.) through a unified interface.
   *
   * @returns {FileSystemBridgeOperationsWithSymbol} The FileSystemBridge instance configured for this store
   */
  get fs(): FileSystemBridgeOperationsWithSymbol {
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

  get versions(): readonly string[] {
    return Object.freeze([...this.#versions]);
  }

  async getFileTree(version: string, extraFilters?: string[]): Promise<UnicodeTreeNode[]> {
    if (!this.#versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    const files = await this.#fs.listdir(join(this.basePath, version), true);

    // TODO: handle the cases where we wanna filter child files.
    return files.filter(({ path }) => this.#filter(trimLeadingSlash(path), extraFilters));
  }

  async getFilePaths(version: string, extraFilters?: string[]): Promise<string[]> {
    if (!this.#versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    const tree = await this.getFileTree(version, extraFilters);

    return flattenFilePaths(tree);
  }

  async getFile(version: string, filePath: string, extraFilters?: string[]): Promise<string> {
    if (!this.#versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    // assertFSCapabilities("read", this.#fs);

    if (!this.#filter(trimLeadingSlash(filePath), extraFilters)) {
      throw new UCDStoreError(`File path "${filePath}" is filtered out by the store's filter patterns.`);
    }

    return await this.#fs.read(join(version, filePath));
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
        const { data, error } = await this.#client.GET("/api/v1/versions");
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

  async analyze(options: AnalyzeOptions): Promise<VersionAnalysis[]> {
    assertCapabilities("analyze", this.#fs);
    const {
      checkOrphaned = false,
      versions = this.#versions,
    } = options;

    let versionAnalyses: VersionAnalysis[] = [];

    try {
      const promises = versions.map(async (version) => {
        if (!this.versions.includes(version)) {
          throw new UCDStoreVersionNotFoundError(version);
        }

        return this.#analyzeVersion(version, {
          checkOrphaned,
        });
      });

      versionAnalyses = await Promise.all(promises);

      return versionAnalyses;
    } catch (err) {
      console.error(`Error during store analysis: ${err instanceof Error ? err.message : String(err)}`);
      return versionAnalyses;
    }
  }

  async #analyzeVersion(version: string, options: AnalyzeOptions): Promise<VersionAnalysis> {
    assertCapabilities("analyze", this.#fs);
    const { checkOrphaned } = options;

    if (!this.#versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    // get the expected files for this version
    const expectedFiles = await getExpectedFilePaths(this.#client, version);

    // get the actual files from the store
    const actualFiles = await this.getFilePaths(version);

    const orphanedFiles: string[] = [];
    const missingFiles: string[] = [];

    for (const expectedFile of expectedFiles) {
      if (!actualFiles.includes(expectedFile)) {
        missingFiles.push(expectedFile);
      }
    }

    for (const actualFile of actualFiles) {
      // if file is not in expected files, it's orphaned
      if (checkOrphaned && !expectedFiles.includes(actualFile)) {
        orphanedFiles.push(actualFile);
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

  async #loadVersionsFromStore(): Promise<void> {
    try {
      const manifestContent = await this.#fs.read(this.#manifestPath);

      // validate the manifest content
      const jsonData = safeJsonParse(manifestContent);
      if (!jsonData) {
        throw new UCDStoreError("store manifest is not a valid JSON");
      }

      // verify that is an array of objects with version and path properties
      const parsedManifest = UCDStoreManifestSchema.safeParse(jsonData);
      if (!parsedManifest.success) {
        throw new UCDStoreError("Invalid store manifest schema");
      }

      this.#versions = Object.keys(parsedManifest.data);
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
    // await this.mirror({ versions, overwrite: false, dryRun: false });

    await this.#createStoreManifest(versions);
    this.#versions = [...versions];
  }

  async #createStoreManifest(versions: string[]): Promise<void> {
    invariant(this.#capabilities.mirror, "createStoreManifest requires write capability");
    invariant(this.basePath, "Base path must be set for store creation");

    const manifestData: UCDStoreManifest = {};

    for (const version of versions) {
      manifestData[version] = prependLeadingSlash(this.basePath ? join(this.basePath, version) : version);
    }

    await this.#fs.write(this.#manifestPath, JSON.stringify(manifestData, null, 2));
  }
}
