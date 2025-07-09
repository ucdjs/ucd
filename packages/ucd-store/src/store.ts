import type { UCDClient, UnicodeVersionFile } from "@ucdjs/fetch";
import type { PathFilter } from "@ucdjs/utils";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import type {
  AnalyzeResult,
  CleanResult,
  StoreCapabilities,
  UCDStoreOptions,
} from "./types";
import path from "node:path";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { invariant, promiseRetry, trimLeadingSlash } from "@luxass/utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { ApiResponseError, createClient, isApiError } from "@ucdjs/fetch";
import { createPathFilter, safeJsonParse } from "@ucdjs/utils";
import defu from "defu";
import { z } from "zod/v4";
import {
  inferStoreCapabilities,
  requiresCapabilities,
} from "./internal/capabilities";
import { UCDStoreError } from "./internal/errors";
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

    this.baseUrl = baseUrl;
    this.basePath = basePath;
    this.#client = createClient(this.baseUrl);
    this.#filter = createPathFilter(globalFilters);
    this.#fs = fs;
    this.#capabilities = inferStoreCapabilities(this.#fs);

    this.#manifestPath = path.join(this.basePath, ".ucd-store.json");
  }

  get fs(): FileSystemBridge {
    return this.#fs;
  }

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
    console.error(`DEBUG: File structure for version ${version}:`, fileStructure);
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
  async analyze(_options: {
    checkOrphaned?: boolean;
    includeDetails?: boolean;
  } = {}): Promise<AnalyzeResult> {
    throw new UCDStoreError("Analysis is not implemented yet.");
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
    const { versions = [], overwrite = false, dryRun = false, concurrency = 5 } = options;
    if (versions?.length === 0) {
      return {
        success: true,
        mirrored: [],
        skipped: [],
        failed: [],
      };
    }
    throw new UCDStoreError("Mirroring is not implemented yet.");
  }

  @requiresCapabilities()
  async repair(): Promise<void> {
    throw new UCDStoreError("Repairing is not implemented yet.");
  }
}
