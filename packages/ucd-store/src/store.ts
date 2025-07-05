import type { UCDClient, UnicodeVersionFile } from "@ucdjs/fetch";
import type { PathFilter } from "@ucdjs/utils";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import type {
  AnalyzeResult,
  CleanResult,
  FileRemovalError,
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

      const files = await this.#fs.listdir(path.join(this.basePath, version), true);

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
  } = {}): Promise<CleanResult> {
    const { dryRun = false, versions: targetVersions } = options;

    const removedFiles: string[] = [];
    const failedRemovals: FileRemovalError[] = [];
    const locatedFiles: string[] = [];

    // Remote stores don't support cleaning
    if (this.mode === "remote") {
      return { removedFiles, failedRemovals, locatedFiles };
    }

    // Determine which versions to clean
    const versionsToClean = targetVersions
      ? targetVersions.filter((v) => this.#versions.includes(v)) // Only clean existing versions
      : this.#versions; // Clean all versions if none specified

    // Collect all files to remove
    for (const version of versionsToClean) {
      try {
        const versionFiles = await this.getFilePaths(version);
        const versionFilePaths = versionFiles.map((file) => `${version}/${file}`);
        locatedFiles.push(...versionFilePaths);
      } catch {
        // If we can't get file paths for a version, skip it silently
        continue;
      }
    }

    // Remove files
    for (const filePath of locatedFiles) {
      try {
        const fullPath = this.#getFullPath(filePath);

        if (await this.#fs.exists(fullPath)) {
          if (!dryRun) {
            await this.#fs.rm(fullPath, { recursive: true });
            removedFiles.push(filePath);
          }
          // In dry run, don't add to removedFiles since we didn't actually remove anything
        }
      } catch (error) {
        failedRemovals.push({
          filePath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // update manifest after cleaning
    if (!dryRun && removedFiles.length > 0) {
      await this.#cleanupAfterRemoval(versionsToClean, targetVersions == null);
    }

    return { removedFiles, failedRemovals, locatedFiles };
  }

  /**
   * Cleanup after file removal - remove empty directories and update manifest
   */
  async #cleanupAfterRemoval(versionsToClean: string[], cleanAllVersions: boolean): Promise<void> {
    if (this.mode !== "local" || !this.basePath) return;

    const versionsToRemoveFromManifest: string[] = [];

    // Check if any versions are now empty and remove empty directories
    for (const version of versionsToClean) {
      const versionPath = path.join(this.basePath, version);

      try {
        if (!this.#fs.exists(versionPath)) {
          continue;
        }
        const files = await this.#fs.listdir(versionPath, true);
        if (files.length === 0) {
          await this.#fs.rm(versionPath, {
            recursive: true,
          });

          versionsToRemoveFromManifest.push(version);
        } else {
          // Version directory doesn't exist, remove from manifest
          versionsToRemoveFromManifest.push(version);
        }
      } catch {
        // If we can't check the directory, assume it should be removed from manifest
        versionsToRemoveFromManifest.push(version);
      }
    }

    // update internal manifest
    if (cleanAllVersions) {
      // If we cleaned all versions, clear the manifest
      this.#versions = [];
    } else {
      // remove only the versions that were cleaned
      this.#versions = this.#versions.filter((v) => !versionsToRemoveFromManifest.includes(v));
    }

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

      console.error(`Analysis completed. Total files to remove: ${analysis.filesToRemove.length}`, analysis.filesToRemove);

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
          console.error(`Adding ${versionAnalysis.orphanedFiles.length} orphaned files from version ${version} to removal list`);
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
      console.error(`Found ${orphanedFiles.length} orphaned files at store level:`, orphanedFiles);
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
        console.error(`Found ${versionOrphans.length} orphaned files in version ${version}:`, versionOrphans);
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

      console.error(`Store-level orphaned files analysis:`);
      console.error(`  Base path: ${this.basePath}`);
      console.error(`  Existing files: ${existingFiles.length}`, existingFiles);
      console.error(`  Expected files: ${expectedFiles.size}`, Array.from(expectedFiles));

      // Find files that exist but aren't expected
      for (const file of existingFiles) {
        // Handle both absolute and relative paths from listdir
        const relativePath = path.isAbsolute(file) ? path.relative(this.basePath!, file) : file;

        console.error(`  Processing file: ${file} -> relativePath: ${relativePath}`);

        // Skip files outside the store directory, manifest file, and version directories
        if (relativePath.startsWith("..") || relativePath === ".ucd-store.json" || relativePath.endsWith("/") || this.#versions.includes(relativePath)) {
          console.error(`    Skipping: ${relativePath}`);
          continue;
        }

        if (!expectedFiles.has(relativePath)) {
          console.error(`    Adding as orphaned: ${relativePath}`);
          orphanedFiles.push(relativePath);
        } else {
          console.error(`    Expected file: ${relativePath}`);
        }
      }
    } catch (error) {
      // If we can't list files, just return empty array
      console.error("Failed to find orphaned files:", error);
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

      console.error(`Version ${version} analysis:`);
      console.error(`  Version path: ${versionPath}`);
      console.error(`  Existing files: ${existingFiles.length}`, existingFiles);
      console.error(`  Expected files: ${expectedFiles.length}`, expectedFiles);

      for (const file of existingFiles) {
        // Only process files that are within the version directory
        const relativePath = path.isAbsolute(file) ? path.relative(versionPath, file) : file;

        console.error(`  Processing file: ${file} -> relativePath: ${relativePath}`);

        // Skip files outside the version directory or that start with ..
        if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
          console.error(`    Skipping (outside directory): ${relativePath}`);
          continue;
        }

        if (!expectedSet.has(relativePath)) {
          console.error(`    Adding as orphaned: ${relativePath}`);
          orphanedFiles.push(`${version}/${relativePath}`);
        } else {
          console.error(`    Expected file: ${relativePath}`);
        }
      }
    } catch (error) {
      console.error(`Error analyzing version ${version}:`, error);
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
