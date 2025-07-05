import type { UCDClient, UnicodeVersionFile } from "@ucdjs/fetch";
import type { PathFilter } from "@ucdjs/utils";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import type {
  AnalyzeResult,
  CleanResult,
  StoreMode,
  UCDStoreOptions,
  VersionAnalysis,
} from "./types";
import path from "node:path";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { invariant, promiseRetry, trimLeadingSlash } from "@luxass/utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { ApiResponseError, createClient } from "@ucdjs/fetch";
import { createPathFilter, safeJsonParse } from "@ucdjs/utils";
import defu from "defu";
import { z } from "zod/v4";
import { processConcurrently } from "./internal/concurrency";
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

      return this.#processFileStructure(data, extraFilters);
    } else {
      // For local mode, read directory structure
      if (!this.basePath) {
        throw new UCDStoreError("Base path not set for local mode");
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

  async clean(options: {
    dryRun?: boolean;
    versions?: string[];
    force?: boolean;
  } = {}): Promise<CleanResult> {
    const { dryRun = false, versions: targetVersions, force = false } = options;

    // Use specified versions or all versions
    const versionsToClean = targetVersions || this.#versions;

    try {
      // First analyze to get files that need to be removed
      const analyzeResult = await this.analyze({
        checkOrphaned: true,
      });

      if (!analyzeResult.success) {
        return {
          success: false,
          error: `Failed to analyze store before cleaning: ${analyzeResult.error}`,
        };
      }

      // Perform the actual cleaning
      return await this.#performClean(analyzeResult.filesToRemove, {
        dryRun,
        versions: versionsToClean,
        force,
      });
    } catch (error) {
      return {
        success: false,
        error: `Clean operation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Internal method to perform the actual cleaning
   */
  async #performClean(filesToRemove: string[], options: {
    dryRun: boolean;
    versions: string[];
    force: boolean;
  }): Promise<CleanResult> {
    const { dryRun, versions, force } = options;
    const fileResults: Array<{ path: string; removed: boolean; error?: string; size?: number }> = [];
    const removedFiles: string[] = [];
    const failedRemovals: Array<{ path: string; removed: boolean; error?: string; size?: number }> = [];

    // Filter files to only include those from target versions
    const filteredFiles = filesToRemove.filter((filePath) => {
      const version = filePath.split("/")[0];
      return version && versions.includes(version);
    });

    // Process files in batches to avoid overwhelming the filesystem
    await processConcurrently(filteredFiles, 10, async (filePath) => {
      try {
        const isRemoved = await this.#removeFile(filePath, { dryRun, force });
        const fileResult = {
          path: filePath,
          removed: isRemoved,
        };

        fileResults.push(fileResult);

        if (isRemoved) {
          removedFiles.push(filePath);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const fileResult = {
          path: filePath,
          removed: false,
          error: errorMsg,
        };

        fileResults.push(fileResult);
        failedRemovals.push(fileResult);
      }
    });

    // Update manifest if files were actually removed
    if (!dryRun && removedFiles.length > 0) {
      await this.#updateManifestAfterClean(removedFiles);
    }

    if (failedRemovals.length > 0) {
      return {
        success: false,
        error: `Failed to remove ${failedRemovals.length} files`,
        partialResults: {
          filesToRemove: filteredFiles,
          fileResults,
          removedFiles,
          failedRemovals,
          deletedCount: removedFiles.length,
        },
      };
    }

    return {
      success: true,
      filesToRemove: filteredFiles,
      fileResults,
      removedFiles,
      failedRemovals,
      deletedCount: removedFiles.length,
    };
  }

  /**
   * Remove a single file with size tracking
   */
  async #removeFile(filePath: string, options: {
    dryRun: boolean;
    force: boolean;
  }): Promise<boolean> {
    const { dryRun, force } = options;
    const fullPath = this.#getFullPath(filePath);

    // check if file exists
    if (!(await this.#fs.exists(fullPath))) {
      return false;
    }

    if (dryRun) {
      return false;
    }

    // Safety check - don't remove if not in store directory (unless forced)
    if (!force && this.mode === "local" && this.basePath) {
      const relativePath = path.relative(this.basePath, fullPath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw new UCDStoreError(`File ${filePath} is outside store directory`);
      }
    }

    await this.#fs.rm(fullPath);
    return true;
  }

  /**
   * Update manifest after cleaning
   */
  async #updateManifestAfterClean(removedFiles: string[]): Promise<void> {
    if (this.mode !== "local") {
      return; // Only relevant for local mode
    }

    // Group removed files by version
    const removedByVersion = new Map<string, string[]>();

    for (const filePath of removedFiles) {
      const [version, ...pathParts] = filePath.split("/");
      if (version && pathParts.length > 0) {
        if (!removedByVersion.has(version)) {
          removedByVersion.set(version, []);
        }
        removedByVersion.get(version)!.push(pathParts.join("/"));
      }
    }

    // Check if any versions are now empty
    const versionsToRemove: string[] = [];

    for (const [version] of removedByVersion) {
      if (await this.#isVersionEmpty(version)) {
        versionsToRemove.push(version);
        await this.#removeEmptyVersionDirectory(version);
      }
    }

    // Update versions array and manifest if needed
    if (versionsToRemove.length > 0) {
      this.#versions = this.#versions.filter((v) => !versionsToRemove.includes(v));
      await this.#updateManifest();
    }
  }

  /**
   * Check if a version directory is empty
   */
  async #isVersionEmpty(version: string): Promise<boolean> {
    if (this.mode !== "local" || !this.basePath) {
      return false;
    }

    try {
      const versionPath = path.join(this.basePath, version);
      const files = await this.#fs.listdir(versionPath, true);
      return files.length === 0;
    } catch {
      return true; // If we can't list, assume empty
    }
  }

  /**
   * Remove empty version directory
   */
  async #removeEmptyVersionDirectory(version: string): Promise<void> {
    if (this.mode !== "local" || !this.basePath) {
      return;
    }

    try {
      const versionPath = path.join(this.basePath, version);
      await this.#fs.rm(versionPath);
    } catch {
      // Ignore errors when removing empty directories
    }
  }

  /**
   * Update the manifest file
   */
  async #updateManifest(): Promise<void> {
    await this.#writeManifest(this.#versions);
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

  /**
   * Get the full filesystem path for a file
   */
  #getFullPath(filePath: string): string {
    if (this.mode === "local") {
      return path.join(this.basePath!, filePath);
    }
    return filePath;
  }

  async analyze(options: {
    checkOrphaned?: boolean;
    includeDetails?: boolean;
  } = {}): Promise<AnalyzeResult> {
    const { checkOrphaned = false, includeDetails = false } = options;

    try {
      const analysis = await this.#performAnalysis({
        checkOrphaned,
        includeDetails,
      });

      return {
        success: true,
        totalFiles: analysis.totalFiles,
        versions: analysis.versions,
        filesToRemove: analysis.filesToRemove,
        storeHealth: analysis.storeHealth,
      };
    } catch (error) {
      return {
        success: false,
        error: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Internal method to perform the actual analysis
   */
  async #performAnalysis(options: {
    checkOrphaned: boolean;
    includeDetails: boolean;
  }): Promise<{
    totalFiles: number;
    versions: VersionAnalysis[];
    filesToRemove: string[];
    storeHealth: "healthy" | "needs_cleanup" | "corrupted";
  }> {
    const { checkOrphaned, includeDetails } = options;

    const versionAnalyses: VersionAnalysis[] = [];
    let totalFiles = 0;
    const filesToRemove: string[] = [];
    let hasIssues = false;

    // Analyze each version
    for (const version of this.#versions) {
      console.error(`Analyzing version: ${version}`);
      try {
        const versionAnalysis = await this.#analyzeVersion(version, {
          checkOrphaned,
          includeDetails,
        });

        versionAnalyses.push(versionAnalysis);
        totalFiles += versionAnalysis.fileCount;

        // Check for issues
        if (!versionAnalysis.isComplete
          || (versionAnalysis.orphanedFiles && versionAnalysis.orphanedFiles.length > 0)) {
          hasIssues = true;
        }

        // Add orphaned files to removal list
        if (versionAnalysis.orphanedFiles) {
          filesToRemove.push(...versionAnalysis.orphanedFiles);
        }
      } catch (error) {
        hasIssues = true;
        // Add a failed version analysis
        versionAnalyses.push({
          version,
          fileCount: 0,
          isComplete: false,
          missingFiles: [`Failed to analyze: ${error instanceof Error ? error.message : String(error)}`],
        });
      }
    }

    // Check for orphaned files at store level if requested
    if (checkOrphaned) {
      const orphanedFiles = await this.#findOrphanedFiles();
      filesToRemove.push(...orphanedFiles);
      if (orphanedFiles.length > 0) {
        hasIssues = true;
      }
    }

    // Determine store health
    let storeHealth: "healthy" | "needs_cleanup" | "corrupted" = "healthy";
    if (hasIssues) {
      storeHealth = filesToRemove.length > 0 ? "needs_cleanup" : "corrupted";
    }

    return {
      totalFiles,
      versions: versionAnalyses,
      filesToRemove,
      storeHealth,
    };
  }

  /**
   * Analyze a specific version
   */
  async #analyzeVersion(version: string, options: {
    checkOrphaned: boolean;
    includeDetails: boolean;
  }): Promise<VersionAnalysis> {
    const { checkOrphaned } = options;

    try {
      const files = await this.getFilePaths(version);
      const orphanedFiles: string[] = [];
      const missingFiles: string[] = [];

      // Check for orphaned files at version level if requested
      if (checkOrphaned) {
        const versionOrphans = await this.#findOrphanedFilesInVersion(version);
        orphanedFiles.push(...versionOrphans);
      }

      // For now, assume all files are complete unless we find issues
      const isComplete = orphanedFiles.length === 0 && missingFiles.length === 0;

      const analysis: VersionAnalysis = {
        version,
        fileCount: files.length,
        isComplete,
      };

      if (orphanedFiles.length > 0) {
        analysis.orphanedFiles = orphanedFiles;
      }

      if (missingFiles.length > 0) {
        analysis.missingFiles = missingFiles;
      }

      return analysis;
    } catch (error) {
      return {
        version,
        fileCount: 0,
        isComplete: false,
        missingFiles: [`Failed to analyze version: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  /**
   * Get the size of a file
   */
  async #getFileSize(version: string, filePath: string): Promise<number> {
    try {
      if (this.mode === "remote") {
        // For remote mode, we can't easily get file sizes without downloading
        // Return 0 for now, or implement HEAD request if the API supports it
        return 0;
      } else {
        const fullPath = path.join(this.basePath!, version, filePath);
        const stats = await this.#fs.stat(fullPath);
        return stats.size;
      }
    } catch {
      return 0;
    }
  }

  /**
   * Find orphaned files (files that exist but aren't tracked in manifest)
   */
  async #findOrphanedFiles(): Promise<string[]> {
    if (this.mode === "remote") {
      // Remote mode doesn't have orphaned files concept
      return [];
    }

    const orphanedFiles: string[] = [];

    try {
      // Get all files that actually exist in the base path
      const existingFiles = await this.#fs.listdir(this.basePath!, true);

      // Get all files that should exist according to manifest
      const expectedFiles = new Set<string>();

      for (const version of this.#versions) {
        const versionFiles = await this.getFilePaths(version);
        for (const file of versionFiles) {
          expectedFiles.add(path.join(version, file));
        }
      }

      // Find files that exist but aren't expected
      for (const file of existingFiles) {
        const relativePath = path.relative(this.basePath!, file);

        // Skip manifest file and directory entries
        if (relativePath === ".ucd-store.json" || relativePath.endsWith("/")) {
          continue;
        }

        if (!expectedFiles.has(relativePath)) {
          orphanedFiles.push(relativePath);
        }
      }
    } catch (error) {
      // If we can't list files, just return empty array
      console.warn("Failed to find orphaned files:", error);
    }

    return orphanedFiles;
  }

  /**
   * Find orphaned files in a specific version
   */
  async #findOrphanedFilesInVersion(version: string): Promise<string[]> {
    if (this.mode === "remote") {
      return [];
    }

    const orphanedFiles: string[] = [];

    try {
      const versionPath = path.join(this.basePath!, version);
      const existingFiles = await this.#fs.listdir(versionPath, true);
      const expectedFiles = await this.getFilePaths(version);
      const expectedSet = new Set(expectedFiles);

      for (const file of existingFiles) {
        const relativePath = path.isAbsolute(file) ? path.relative(versionPath, file) : file;
        if (!expectedSet.has(relativePath) && !relativePath.startsWith('..')) {
          orphanedFiles.push(`${version}/${relativePath}`);
        }
      }
    } catch {
      // If we can't analyze this version, skip it
    }

    return orphanedFiles;
  }

  /**
   * Mirror UCD files from remote to local storage
   */
  async #mirror(options: {
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
    if (this.mode !== "local") {
      return {
        success: false,
        error: "Mirror operation is only supported for local stores",
      };
    }

    const { versions = this.#versions, overwrite = false, dryRun = false, concurrency = 5 } = options;
    const mirrored: string[] = [];
    const skipped: string[] = [];
    const failed: string[] = [];

    try {
      // First, collect all version-file pairs that need to be processed
      const allFiles: Array<{ version: string; filePath: string }> = [];

      for (const version of versions) {
        try {
          const { data, error } = await this.#client.GET("/api/v1/files/{version}", {
            params: { path: { version } },
          });

          if (error) {
            throw new ApiResponseError(error);
          }

          const files = flattenFilePaths(data);

          // Ensure version directory exists
          const versionPath = path.join(this.basePath!, version);
          if (!dryRun && !await this.#fs.exists(versionPath)) {
            await this.#fs.mkdir(versionPath);
          }

          // Add all files for this version to the processing queue
          allFiles.push(...files.map((filePath) => ({ version, filePath })));
        } catch (error) {
          failed.push(`Version ${version}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Now process all files with a single concurrency control
      await processConcurrently(allFiles, concurrency, async ({ version, filePath }) => {
        try {
          const result = await this.#mirrorFile(version, filePath, { overwrite, dryRun });
          if (result.mirrored) {
            mirrored.push(filePath);
          } else {
            skipped.push(filePath);
          }
        } catch (error) {
          failed.push(`${version}/${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      });

      return {
        success: failed.length === 0,
        mirrored,
        skipped,
        failed,
      };
    } catch (error) {
      return {
        success: false,
        error: `Mirror operation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Mirror a specific file
   */
  async #mirrorFile(version: string, filePath: string, options: {
    overwrite: boolean;
    dryRun: boolean;
  }): Promise<{ mirrored: boolean }> {
    const { overwrite, dryRun } = options;
    const localPath = path.join(this.basePath!, version, filePath);

    // Check if file already exists
    if (!overwrite && await this.#fs.exists(localPath)) {
      return { mirrored: false };
    }

    if (dryRun) {
      return { mirrored: true };
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(localPath);
    if (!await this.#fs.exists(parentDir)) {
      await this.#fs.mkdir(parentDir);
    }

    // Download file content from HTTP filesystem
    const content = await this.#fs.read(`${version}/${filePath}`);

    // Write to local filesystem
    await this.#fs.write(localPath, content);

    return { mirrored: true };
  }
}
