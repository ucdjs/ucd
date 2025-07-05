import type { UCDClient, UnicodeVersionFile } from "@ucdjs/fetch";
import type { PathFilter } from "@ucdjs/utils";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import type { AnalyzeOptions, AnalyzeResult } from "./internal/analyze";
import type { CleanResult } from "./internal/clean";
import type { StoreMode, UCDStoreOptions } from "./types";
import path from "node:path";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { invariant, promiseRetry, trimLeadingSlash } from "@luxass/utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { ApiResponseError, createClient } from "@ucdjs/fetch";
import { createPathFilter, safeJsonParse } from "@ucdjs/utils";
import defu from "defu";
import { z } from "zod/v4";
import { analyzeStore } from "./internal/analyze";
import { cleanStore } from "./internal/clean";
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
   *
   * TODO(@luxass): See if we can either remove this, or make it also used in remote mode.
   */
  public readonly basePath?: string;

  #client: UCDClient;
  #filter: PathFilter;
  #fs: FileSystemBridge;
  #versions: string[] = [];
  #manifestPath: string;

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
    this.#versions = versions;
    this.#client = createClient(this.baseUrl);
    this.#filter = createPathFilter(globalFilters);
    this.#fs = fs;
    this.#manifestPath = this.mode === "local" ? path.join(this.basePath!, ".ucd-store.json") : ".ucd-store.json";
  }

  get fs(): FileSystemBridge {
    return this.#fs;
  }

  get filter(): PathFilter {
    return this.#filter;
  }

  get client(): UCDClient {
    return this.#client;
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
      throw new Error(`Failed to load store manifest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async #createNewLocalStore(versions: string[]): Promise<void> {
    invariant(this.mode === "local", "createNewLocalStore can only be called in local mode");
    invariant(this.basePath, "Base path must be set for local store");

    if (!await this.#fs.exists(this.basePath)) {
      await this.#fs.mkdir(this.basePath);
    }

    // TODO: Implement actual file mirroring
    // await mirrorUCDFiles({
    //   versions,
    //   basePath: this.basePath,
    //   fs: this.#fs,
    //   patternMatcher: this.#filter,
    // });

    await this.createStoreManifest(versions);
    this.#versions = [...versions];
  }

  private async createStoreManifest(versions: string[]): Promise<void> {
    const manifestData = versions.map((version) => ({
      version,
      path: this.mode === "local" ? path.join(this.basePath!, version) : version,
    }));

    await this.#fs.write(this.#manifestPath, JSON.stringify(manifestData, null, 2));
  }

  async getFileTree(version: string, extraFilters?: string[]): Promise<UnicodeVersionFile[]> {
    if (!this.hasVersion(version)) {
      throw new Error(`Version '${version}' not found in store`);
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

      return this.#processFileStructure(data, extraFilters);
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

      return this.#processFileStructure(fileStructure, extraFilters);
    }
  }

  get versions(): readonly string[] {
    // figure out is this have some performance impact
    return Object.freeze([...this.#versions]);
  }

  async getFile(version: string, filePath: string, extraFilters?: string[]): Promise<string> {
    if (!this.hasVersion(version)) {
      throw new Error(`Version '${version}' not found in store`);
    }

    if (!this.#filter(trimLeadingSlash(filePath), extraFilters)) {
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

  async clean(dryRun?: boolean): Promise<CleanResult> {
    // First analyze to get files that need to be removed
    const analyzeResult = await analyzeStore(this.#manifestPath, {
      calculateSizes: true,
      checkOrphaned: true,
      fs: this.#fs,
      versions: this.#versions,
    });

    if (!analyzeResult.success) {
      return {
        success: false,
        error: `Failed to analyze store before cleaning: ${analyzeResult.error}`,
      };
    }

    // Use the files to remove from analysis
    return cleanStore(analyzeResult.filesToRemove, {
      fs: this.#fs,
      dryRun: dryRun || false,
      versions: this.versions,
    });
  }

  async analyze(options: Omit<AnalyzeOptions, "fs" | "versions"> = {}): Promise<AnalyzeResult> {
    return analyzeStore(this.#manifestPath, {
      ...options,
      fs: this.#fs,
      versions: this.#versions,
    });
  }
}
