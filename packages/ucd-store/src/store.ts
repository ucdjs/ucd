import type { UCDClient, UnicodeVersionFile } from "@ucdjs/fetch";
import type { PathFilter } from "@ucdjs/utils";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import type {
  AnalyzeResult,
  CleanResult,
  StoreCapabilities,
  StoreMode,
  UCDStoreOptions,
} from "./types";
import path from "node:path";
import { invariant, promiseRetry, trimLeadingSlash } from "@luxass/utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { ApiResponseError, createClient } from "@ucdjs/fetch";
import { createPathFilter, safeJsonParse } from "@ucdjs/utils";
import defu from "defu";
import { z } from "zod/v4";
import { assertCapabilities, inferStoreCapabilities } from "./internal/capabilities";
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
   * Store mode, either "local" or "remote".
   * - "local" means the store is on the local filesystem.
   * - "remote" means the store is accessed via HTTP.
   */
  public readonly mode: StoreMode;

  /**
   * Base path for the local store.
   * Only used in "local" mode.
   */
  public readonly basePath?: string;

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
    const { baseUrl, globalFilters, mode, fs, basePath } = defu(options, {
      baseUrl: UCDJS_API_BASE_URL,
      globalFilters: [],
      mode: "remote" as StoreMode,
      basePath: "./ucd-files",
    });

    this.mode = mode;
    this.baseUrl = baseUrl;
    this.basePath = basePath;
    this.#client = createClient(this.baseUrl);
    this.#filter = createPathFilter(globalFilters);
    this.#fs = fs;
    this.#capabilities = inferStoreCapabilities(this.#fs);

    this.#manifestPath = this.mode === "local" ? path.join(this.basePath!, ".ucd-store.json") : ".ucd-store.json";
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
    const isValidStore = this.mode === "local"
      ? await this.#fs.exists(this.basePath!) && await this.#fs.exists(this.#manifestPath!)
      : await this.#fs.exists(this.#manifestPath!);

    if (isValidStore) {
      await this.#loadVersionsFromStore();
    } else {
      // we can't initialize a remote store without existing data.
      // and since the store endpoint isn't valid, we can't fetch the data either.
      // so we throw an error here.
      if (this.mode === "remote") {
        throw new UCDStoreError("Remote store cannot be initialized without existing data. Please provide a valid store URL or initialize a local store.");
      }

      if (!this.#versions || this.#versions.length === 0) {
        throw new UCDStoreError("No versions provided for initializing new local store");
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
        throw new UCDStoreError("Invalid JSON format in store manifest");
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
    invariant(this.mode === "local", "createNewLocalStore can only be called in local mode");
    invariant(this.basePath, "Base path must be set for local store");

    if (!await this.#fs.exists(this.basePath)) {
      await this.#fs.mkdir(this.basePath);
    }

    // Mirror UCD files from remote to local
    await this.#mirror({ versions, overwrite: false, dryRun: false });

    await this.#createStoreManifest(versions);
    this.#versions = [...versions];
  }

  async #createStoreManifest(versions: string[]): Promise<void> {
    invariant(this.mode === "local", "createStoreManifest can only be called in local mode");
    invariant(this.basePath, "Base path must be set for local store");

    await this.#writeManifest(versions);
  }

  async getFileTree(version: string, extraFilters?: string[]): Promise<UnicodeVersionFile[]> {
    if (!this.hasVersion(version)) {
      throw new UCDStoreError(`Version '${version}' not found in store`);
    }

    if (this.mode === "remote") {
      const data = await promiseRetry(async () => {
        const { data, error } = await this.#client.GET("/api/v1/files/{version}", {
          params: { path: { version } },
        });

        if (error != null) {
          throw new ApiResponseError(error);
        }

        return data;
      }, {
        retries: 3,
        minTimeout: 500,
      });
      console.error(`DEBUG: Remote file structure for version ${version}:`, data);
      return this.#processFileStructure(data, extraFilters);
    } else {
      // For local mode, read directory structure
      if (!this.basePath) {
        throw new UCDStoreError("Base path not set for local mode");
      }

      const files = await this.#fs.listdir(path.join(this.basePath, version), true);
      console.error(`DEBUG: Local file structure for version ${version}:`, files);
      const fileStructure = files.map((file) => ({
        name: path.basename(file.path),
        path: file.path,
        type: file.type === "directory" ? "directory" : "file",
      }));

      return this.#processFileStructure(fileStructure, extraFilters);
    }
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

    if (this.mode === "remote") {
      // HTTP filesystem handles the caching and fetching
      return await this.#fs.read(`${version}/${filePath}`);
    } else {
      // Local filesystem
      if (!this.basePath) {
        throw new UCDStoreError("Base path not set for local mode");
      }

      const fullPath = path.join(this.basePath, version, filePath);
      return await this.#fs.read(fullPath);
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

  async clean(_options: {
    dryRun?: boolean;
    versions?: string[];
  } = {}): Promise<CleanResult> {
    assertCapabilities("clean", this.#fs);

    throw new UCDStoreError("Cleaning is not implemented yet.");
  }

  /**
   * Write manifest data to file
   */
  async #writeManifest(versions: string[]): Promise<void> {
    const manifestData = versions.map((version) => ({
      version,
      path: this.mode === "local" ? path.join(this.basePath!, version) : version,
    }));

    await this.#fs.write(this.#manifestPath, JSON.stringify(manifestData, null, 2));
  }

  async analyze(_options: {
    checkOrphaned?: boolean;
    includeDetails?: boolean;
  } = {}): Promise<AnalyzeResult> {
    assertCapabilities("analyze", this.#fs);

    throw new UCDStoreError("Analysis is not implemented yet.");
  }

  async #mirror(_options: {
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
    assertCapabilities("mirror", this.#fs);

    throw new UCDStoreError("Mirroring is not implemented yet.");
  }

  async repair(): Promise<void> {
    assertCapabilities("repair", this.#fs);

    throw new UCDStoreError("Repairing is not implemented yet.");
  }
}
