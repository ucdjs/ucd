import type { UCDStore, UCDStoreOptions, UnicodeVersionFile } from "./store";
import path from "node:path";
import { invariant } from "@luxass/utils";
import fsx from "fs-extra";
import { z } from "zod/v4";

import { download, repairStore } from "./download";
import { resolveUCDStoreOptions } from "./store";

export const UCD_STORE_SCHEMA = z.array(
  z.object({
    version: z.string(),
    path: z.string(),
  }),
);

export type UCDStoreSchema = z.infer<typeof UCD_STORE_SCHEMA>;

export interface LocalUCDStoreOptions extends UCDStoreOptions {
  /**
   * Base path for the local UCD store
   */
  basePath?: string;

  /**
   * Versions to initialize the store with.
   * If not provided, the store will be initialized with all available versions.
   *
   * @default undefined
   * @example ["15.0.0", "16.0.0"]
   */
  versions?: string[];
}

export class LocalUCDStore implements UCDStore {
  public readonly baseUrl: string;
  public readonly proxyUrl: string;
  public readonly filters: string[];
  public basePath: string;
  private _versions: string[] = [];
  private _providedVersions?: string[];

  constructor(options: LocalUCDStoreOptions = {}) {
    const {
      baseUrl,
      proxyUrl,
      filters,
      basePath,
    } = resolveUCDStoreOptions(options, {
      basePath: "./ucd-files",
    });

    this.baseUrl = baseUrl;
    this.proxyUrl = proxyUrl;
    this.filters = filters;
    this.basePath = path.resolve(basePath);
    this._providedVersions = options.versions;
  }

  async bootstrap(): Promise<void> {
    invariant(this.basePath, "Base path is required for LocalUCDStore.");

    // Check if the store is valid (has manifest file)
    const storeManifestPath = path.join(this.basePath, ".ucd-store.json");
    const isValidStore = await fsx.pathExists(this.basePath) && await fsx.pathExists(storeManifestPath);

    if (isValidStore) {
      // Load versions from existing store
      await this._loadVersionsFromStore();

      // Validate the store and repair any missing files
      await this._validateAndRepairStore();
    } else {
      // Initialize new store with provided versions
      if (!this._providedVersions || this._providedVersions.length === 0) {
        throw new Error(
          `[ucd-store]: No versions provided for initializing LocalUCDStore. Please provide versions in the constructor options.`,
        );
      }

      await this._initializeStore(this._providedVersions);
    }
  }

  private async _loadVersionsFromStore(): Promise<void> {
    const storeManifestPath = path.join(this.basePath, ".ucd-store.json");

    try {
      const manifestContent = await fsx.readFile(storeManifestPath, "utf-8");
      const manifestData = JSON.parse(manifestContent);

      // Validate the manifest data against the schema
      const validatedData = UCD_STORE_SCHEMA.parse(manifestData);

      // Extract versions and populate the _versions array
      this._versions = validatedData.map((entry) => entry.version);
    } catch (error) {
      throw new Error(
        `[ucd-store]: Failed to load store manifest: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async _initializeStore(versions: string[]): Promise<void> {
    // Create the base path if it doesn't exist
    await fsx.ensureDir(this.basePath);

    // Call setupLocalUCDStore to download and initialize the store
    await download({
      versions,
      basePath: this.basePath,
    });

    // Create the store manifest file
    await this._createStoreManifest(versions);

    // After successful initialization, populate the _versions array
    this._versions = [...versions];
  }

  private async _createStoreManifest(versions: string[]): Promise<void> {
    const storeManifestPath = path.join(this.basePath, ".ucd-store.json");

    // Create the manifest data according to the UCD_STORE_SCHEMA
    const manifestData: UCDStoreSchema = versions.map((version) => ({
      version,
      path: path.join(this.basePath, version), // Assuming each version has its own directory
    }));

    try {
      await fsx.writeFile(storeManifestPath, JSON.stringify(manifestData, null, 2), "utf-8");
    } catch (error) {
      throw new Error(
        `[ucd-store]: Failed to create store manifest: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async _validateAndRepairStore(): Promise<void> {
    // Use the repairStore function to validate and repair the store
    const repairResult = await repairStore(
      {
        basePath: this.basePath,
        versions: this._versions,
      },
      {
        excludePatterns: this.filters,
        concurrency: 5,
      },
    );

    // Log results
    if (repairResult.totalMissingFiles > 0) {
      if (repairResult.repairedFiles.length > 0) {
        console.warn(`[ucd-store]: Successfully repaired ${repairResult.repairedFiles.length} out of ${repairResult.totalMissingFiles} missing files.`);
      }

      if (repairResult.errors.length > 0) {
        console.warn(`[ucd-store]: ${repairResult.errors.length} files failed to repair:`, repairResult.errors);
      }
    }
  }

  get versions(): string[] {
    return [...this._versions];
  }

  async getFilePaths(version: string): Promise<string[]> {
    if (!this.hasVersion(version)) {
      throw new Error(`Version '${version}' not found in store`);
    }

    throw new Error("Method not implemented.");
  }

  async getFile(version: string, _filePath: string): Promise<string> {
    if (!this.hasVersion(version)) {
      throw new Error(`Version '${version}' not found in store`);
    }

    throw new Error("Method not implemented.");
  }

  hasVersion(version: string): boolean {
    return this._versions.includes(version);
  }

  async getFileTree(version: string): Promise<UnicodeVersionFile[]> {
    const filePaths = await this.getFilePaths(version);
    return filePaths.map((filePath) => ({
      name: path.basename(filePath),
      path: filePath,
    }));
  }
}
