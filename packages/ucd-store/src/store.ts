import type { UCDClient, UnicodeTreeNode } from "@ucdjs/fetch";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { PathFilter } from "@ucdjs/utils";
import type { AnalyzeOptions, MirrorOptions, UCDStoreOptions, VersionAnalysis } from "./types";
import { prependLeadingSlash, trimLeadingSlash } from "@luxass/utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createClient, isApiError } from "@ucdjs/fetch";
import { assertCapability } from "@ucdjs/fs-bridge";
import { UCDStoreManifestSchema } from "@ucdjs/schemas";
import { createPathFilter, flattenFilePaths, safeJsonParse } from "@ucdjs/utils";
import defu from "defu";
import { join } from "pathe";
import { UCDStoreError, UCDStoreVersionNotFoundError } from "./errors";
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
  #fs: FileSystemBridge;
  #versions: string[] = [];
  #manifestPath: string;

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
    this.#fs = fs;
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

  get versions(): readonly string[] {
    return Object.freeze([...this.#versions]);
  }

  /**
   * Retrieves the file tree structure for a specific Unicode version.
   *
   * This method returns a hierarchical representation of all files available in the store
   * for the specified version. The files are filtered using the store's global filters
   * and any additional filters provided.
   *
   * @param version - The Unicode version to retrieve the file tree for (e.g., "15.1.0")
   * @param extraFilters - Optional additional filter patterns to apply alongside global filters
   * @returns A promise that resolves to an array of UnicodeTreeNode objects representing the file structure
   *
   * @throws {UCDStoreVersionNotFoundError} When the specified version is not available in the store
   * @throws {BridgeUnsupportedOperation} When the filesystem doesn't support the required 'listdir' capability
   */
  async getFileTree(version: string, extraFilters?: string[]): Promise<UnicodeTreeNode[]> {
    assertCapability(this.#fs, "listdir");
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

  /**
   * Initialize the store - loads existing data or creates new structure
   */
  async initialize(): Promise<void> {
    assertCapability(this.#fs, "exists");
    const isValidStore = await this.#fs.exists(this.#manifestPath);

    if (isValidStore) {
      await this.#loadVersionsFromStore();
    } else {
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
      });

      versionAnalyses = await Promise.all(promises);

      return versionAnalyses;
    } catch (err) {
      console.error(`Error during store analysis: ${err instanceof Error ? err.message : String(err)}`);
      return versionAnalyses;
    }
  }

  async mirror(options: MirrorOptions): Promise<{
    success: boolean;
    error?: string;
    mirrored?: string[];
    skipped?: string[];
    failed?: string[];
  }> {
    assertCapability(this.#fs, ["exists", "mkdir"]);
    const { versions = this.#versions, concurrency = 5, dryRun = false } = options;

    const mirrored: string[] = [];
    const skipped: string[] = [];
    const failed: string[] = [];

    try {
      const filesQueue = await Promise.all(
        versions.map(async (version) => {
          if (!this.#versions.includes(version)) {
            throw new UCDStoreVersionNotFoundError(version);
          }
          const filePaths = await getExpectedFilePaths(this.#client, version);
          return filePaths.map((filePath): [string, string] => [version, filePath]);
        })
      ).then(results => results.flat());


    } catch (err) {
      return {
        success: false,
        error: `Failed to prepare files for mirroring: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  async #loadVersionsFromStore(): Promise<void> {
    assertCapability(this.#fs, "read");
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
    assertCapability(this.#fs, ["exists", "mkdir", "write"]);

    if (!await this.#fs.exists(this.basePath)) {
      await this.#fs.mkdir(this.basePath);
    }

    // Mirror UCD files from remote to local
    // await this.mirror({ versions, overwrite: false, dryRun: false });

    const manifestData: UCDStoreManifest = {};

    for (const version of versions) {
      manifestData[version] = prependLeadingSlash(this.basePath ? join(this.basePath, version) : version);
    }

    await this.#fs.write(this.#manifestPath, JSON.stringify(manifestData, null, 2));
    this.#versions = [...versions];
  }
}
    }

    await this.#fs.write(this.#manifestPath, JSON.stringify(manifestData, null, 2));
    this.#versions = [...versions];
  }
}
