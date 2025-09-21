import type { UCDClient, UnicodeTreeNode } from "@ucdjs/fetch";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { OperationResult, PathFilter, PathFilterOptions } from "@ucdjs/shared";
import type { StoreError } from "./errors";
import type { AnalyzeOptions, AnalyzeResult } from "./internal/analyze";
import type { CleanOptions, CleanResult } from "./internal/clean";
import type { MirrorOptions, MirrorResult } from "./internal/mirror";
import type { RepairOptions, RepairResult } from "./internal/repair";
import type {
  InitOptions,
  UCDStoreOptions,
} from "./types";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createClient, isApiError } from "@ucdjs/fetch";
import { assertCapability } from "@ucdjs/fs-bridge";
import { UCDStoreManifestSchema } from "@ucdjs/schemas";
import { createPathFilter, filterTreeStructure, flattenFilePaths, safeJsonParse, tryCatch } from "@ucdjs/shared";
import defu from "defu";
import { isAbsolute, join } from "pathe";
import {
  UCDStoreFileNotFoundError,
  UCDStoreGenericError,
  UCDStoreInvalidManifestError,
  UCDStoreNotInitializedError,
  UCDStoreVersionNotFoundError,
} from "./errors";
import { internal__analyze } from "./internal/analyze";
import { internal__clean } from "./internal/clean";
import { internal__mirror } from "./internal/mirror";
import { internal__repair } from "./internal/repair";

const DEFAULT_CONCURRENCY = 5;

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
  #initialized: boolean = false;

  constructor(options: UCDStoreOptions) {
    const { baseUrl, globalFilters, fs, basePath, versions } = defu(options, {
      baseUrl: UCDJS_API_BASE_URL,
      globalFilters: {},
      basePath: "",
      versions: [],
    });

    console.error("HELLO!");

    if (fs == null) {
      throw new UCDStoreGenericError("FileSystemBridge instance is required to create a UCDStore.");
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

  get initialized(): boolean {
    return this.#initialized;
  }

  get manifestPath(): string {
    return this.#manifestPath;
  }

  async getFileTree(version: string, extraFilters?: Pick<PathFilterOptions, "include" | "exclude">): Promise<OperationResult<UnicodeTreeNode[], StoreError>> {
    return tryCatch(async () => {
      if (!this.#initialized) {
        throw new UCDStoreNotInitializedError();
      }

      if (!this.#versions.includes(version)) {
        throw new UCDStoreVersionNotFoundError(version);
      }

      assertCapability(this.#fs, ["listdir", "exists"]);
      if (!await this.#fs.exists(join(this.basePath, version))) {
        throw new UCDStoreVersionNotFoundError(version);
      }

      const entries = await this.#fs.listdir(join(this.basePath, version), true);

      const filtered = filterTreeStructure(this.#filter, entries, extraFilters);

      return filtered;
    });
  }

  async getFilePaths(version: string, extraFilters?: Pick<PathFilterOptions, "include" | "exclude">): Promise<OperationResult<string[], StoreError>> {
    return tryCatch(async () => {
      if (!this.#initialized) {
        throw new UCDStoreNotInitializedError();
      }

      if (!this.#versions.includes(version)) {
        throw new UCDStoreVersionNotFoundError(version);
      }

      const [data, error] = await this.getFileTree(version, extraFilters);

      if (error != null) {
        throw error;
      }

      return flattenFilePaths(data);
    });
  }

  async getFile(version: string, filePath: string, extraFilters?: Pick<PathFilterOptions, "include" | "exclude">): Promise<OperationResult<string, StoreError>> {
    return tryCatch(async () => {
      if (!this.#initialized) {
        throw new UCDStoreNotInitializedError();
      }

      if (!this.#versions.includes(version)) {
        throw new UCDStoreVersionNotFoundError(version);
      }

      if (!this.#filter(filePath, extraFilters)) {
        const extraFiltersInfo = extraFilters
          ? Object.entries(extraFilters)
              .filter(([, value]) => value != null)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
              .join("; ")
          : "";

        throw new UCDStoreGenericError(
          `File path "${filePath}" is excluded by the store's filter patterns${
            extraFiltersInfo ? ` (extra filters: ${extraFiltersInfo})` : ""
          }.`,
        );
      }

      assertCapability(this.#fs, "read");
      try {
        let content = "";
        if (isAbsolute(filePath)) {
          content = await this.#fs.read(filePath);
        } else {
          content = await this.#fs.read(join(version, filePath));
        }

        return content;
      } catch (err) {
        if (err instanceof Error) {
          const code = (err as any)?.code;
          if (code === "ENOENT" || err.message.includes("ENOENT")) {
            throw new UCDStoreFileNotFoundError(filePath, version);
          }
        }

        throw err;
      }
    });
  }

  async init(options: InitOptions = {}): Promise<void> {
    const { force = false, dryRun = false } = options;

    assertCapability(this.#fs, ["exists"]);

    // fetch available versions from API to validate
    const { data, error } = await this.#client.GET("/api/v1/versions");
    if (isApiError(error)) {
      throw new UCDStoreGenericError(
        `Failed to fetch Unicode versions: ${error.message}${
          error.status ? ` (status ${error.status})` : ""}`,
      );
    }

    let hasVersionManifestChanged = false;

    const availableVersions = data?.map(({ version }) => version) || [];

    // read existing manifest if it exists
    let manifestVersions: string[] = [];
    const manifestExists = await this.#fs.exists(this.#manifestPath);
    if (manifestExists && !force) {
      const manifest = await this["~readManifest"]();
      manifestVersions = Object.keys(manifest);
    }

    // use api versions if no constructor versions, no versions in manifest & manifest doesn't exist
    if (this.#versions.length === 0 && (manifestVersions.length === 0 && (!manifestExists || force))) {
      // No versions specified anywhere, use all available
      this.#versions = availableVersions;
      hasVersionManifestChanged = true;
    }

    // if there is both constructor and manifest versions, merge them
    if (this.#versions.length > 0 && manifestVersions.length > 0) {
      this.#versions = Array.from(new Set([...this.#versions, ...manifestVersions]));
      hasVersionManifestChanged = true;
    }

    // if no constructor versions, but manifest versions exist
    // use manifest versions.
    if (this.#versions.length === 0 && manifestVersions.length > 0) {
      this.#versions = manifestVersions;
    }

    // validate all versions exist in API
    const missingVersions = this.#versions.filter((v) => !availableVersions.includes(v));
    if (missingVersions.length > 0) {
      throw new UCDStoreGenericError(
        `Some requested versions are not available in the API: ${missingVersions.join(", ")}`,
      );
    }

    if (!dryRun) {
      // only create base directory if it doesn't exist or if forced
      if (!manifestExists || force) {
        const basePathExists = await this.#fs.exists(this.basePath);
        if (!basePathExists) {
          assertCapability(this.#fs, ["mkdir"]);
          await this.#fs.mkdir(this.basePath);
        }
      }

      // write manifest if versions have changed, doesn't exist, or forced
      if (hasVersionManifestChanged || !manifestExists || force) {
        await this["~writeManifest"](this.#versions);
      }
    }

    this.#initialized = true;
  }

  /**
   * Analyzes the store to identify potential issues and inconsistencies.
   *
   * This method performs a comprehensive analysis of the specified Unicode versions
   * in the store, checking for missing files, orphaned files (if enabled), and other
   * integrity issues. The analysis helps maintain store health and identify problems
   * that may need attention.
   *
   * @param {AnalyzeOptions} options - Configuration options for the analysis operation
   * @returns {Promise<OperationResult<AnalyzeResult[], StoreError>>} A promise that resolves to a StoreOperationResult containing an array of VersionAnalysis objects, one for each analyzed version
   */
  async analyze(options: AnalyzeOptions): Promise<OperationResult<AnalyzeResult[], StoreError>> {
    return tryCatch(async () => {
      if (!this.#initialized) {
        throw new UCDStoreNotInitializedError();
      }

      let {
        checkOrphaned = false,
        versions = [],
      } = options;

      if (versions.length === 0) {
        versions = this.#versions;
      }

      const result = await internal__analyze(this, {
        checkOrphaned,
        versions,
      });

      return result;
    });
  }

  /**
   * Mirrors Unicode data files from the remote UCD API to the local store.
   *
   * This method downloads and synchronizes Unicode data files for the specified versions
   * from the remote UCD API to the local filesystem. It handles concurrent downloads,
   * supports dry-run mode for testing, and can force re-download of existing files.
   * The mirroring process ensures that the local store contains all necessary files
   * for the specified Unicode versions.
   *
   * @param {MirrorOptions} options - Configuration options for the mirroring operation
   * @returns {Promise<OperationResult<MirrorResult[], StoreError>>} A promise that resolves to an array of MirrorResult objects, one for each mirrored version
   */
  async mirror(options: MirrorOptions = {}): Promise<OperationResult<MirrorResult[], StoreError>> {
    return tryCatch(async () => {
      if (!this.#initialized) {
        throw new UCDStoreNotInitializedError();
      }

      let {
        versions = [],
        concurrency = DEFAULT_CONCURRENCY,
        dryRun = false,
        force = false,
      } = options;

      if (versions.length === 0) {
        versions = this.#versions;
      }

      const result = await internal__mirror(this, {
        versions,
        concurrency,
        dryRun,
        force,
      });

      return result;
    });
  }

  /**
   * Cleans orphaned and invalid files from the store.
   *
   * This method analyzes the store to identify files that should not exist (orphaned files)
   * or are corrupted/invalid, and removes them from the filesystem. This helps maintain
   * store integrity and free up disk space.
   *
   * @param {CleanOptions} options - Configuration options for the cleaning operation
   * @return {Promise<OperationResult<CleanResult[], StoreError>>} A promise that resolves to an array of CleanResult objects, one for each version cleaned
   */
  async clean(options: CleanOptions = {}): Promise<OperationResult<CleanResult[], StoreError>> {
    return tryCatch(async () => {
      if (!this.#initialized) {
        throw new UCDStoreNotInitializedError();
      }

      let {
        versions = [],
        concurrency = DEFAULT_CONCURRENCY,
        dryRun = false,
      } = options;

      if (versions.length === 0) {
        versions = this.#versions;
      }

      const result = await internal__clean(this, {
        versions,
        concurrency,
        dryRun,
      });

      return result;
    });
  }

  async repair(options: RepairOptions = {}): Promise<OperationResult<RepairResult[], StoreError>> {
    return tryCatch(async () => {
      if (!this.#initialized) {
        throw new UCDStoreNotInitializedError();
      }

      let {
        versions = [],
        concurrency = DEFAULT_CONCURRENCY,
        dryRun = false,
      } = options;

      if (versions.length === 0) {
        versions = this.#versions;
      }

      const result = await internal__repair(this, {
        versions,
        concurrency,
        dryRun,
      });

      return result;
    });
  }

  async "~writeManifest"(versions: string[]): Promise<void> {
    assertCapability(this.#fs, "write");
    const manifestData: UCDStoreManifest = {};

    for (const version of versions) {
      manifestData[version] = version;
    }

    await this.#fs.write(this.#manifestPath, JSON.stringify(manifestData, null, 2));
  }

  async "~readManifest"(): Promise<UCDStoreManifest> {
    assertCapability(this.#fs, "read");
    const manifestData = await this.#fs.read(this.#manifestPath);

    if (!manifestData) {
      throw new UCDStoreInvalidManifestError(this.#manifestPath, "store manifest is empty");
    }

    const jsonData = safeJsonParse(manifestData);
    if (!jsonData) {
      throw new UCDStoreInvalidManifestError(this.#manifestPath, "store manifest is not a valid JSON");
    }

    const parsedManifest = UCDStoreManifestSchema.safeParse(jsonData);
    if (!parsedManifest.success) {
      throw new UCDStoreInvalidManifestError(this.#manifestPath, `store manifest is not a valid JSON: ${parsedManifest.error.message}`);
    }

    return parsedManifest.data;
  }
}
