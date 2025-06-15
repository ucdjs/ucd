import type { UnicodeVersionFile } from "@luxass/unicode-utils-new/fetch";
import type { FSAdapter } from "@ucdjs/utils/types";
import type { UCDStore, UCDStoreOptions } from "./store";
import path from "node:path";
import { invariant } from "@luxass/utils";
import { createPathFilter, type FilterFn } from "@ucdjs/utils";
import { createDefaultFSAdapter, mirrorUCDFiles } from "@ucdjs/utils/ucd-files";
import { z } from "zod/v4";
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

  /**
   * Custom filesystem interface. If not provided, defaults to fs-extra implementation.
   */
  fs?: FSAdapter;
}

export class LocalUCDStore implements UCDStore {
  public readonly baseUrl: string;
  public readonly proxyUrl: string;
  public basePath: string;
  private _versions: string[] = [];
  private _providedVersions?: string[];
  #filter: FilterFn;
  #fs: FSAdapter;

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
    this.basePath = path.resolve(basePath);
    this._providedVersions = options.versions;

    // TODO: fix this!
    this.#fs = options.fs!;
    this.#filter = createPathFilter(filters);
  }

  async bootstrap(): Promise<void> {
    invariant(this.basePath, "Base path is required for LocalUCDStore.");
    this.#fs = this.#fs || (await createDefaultFSAdapter());

    // Check if the store is valid (has manifest file)
    const storeManifestPath = path.join(this.basePath, ".ucd-store.json");
    const isValidStore = await this.#fs.exists(this.basePath) && await this.#fs.exists(storeManifestPath);

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
      const manifestContent = await this.#fs.readFile(storeManifestPath);
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
    await this.#fs.ensureDir(this.basePath);

    await mirrorUCDFiles({
      versions,
      basePath: this.basePath,
      fs: this.#fs,
      patternMatcher: this.#filter,
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
      await this.#fs.writeFile(storeManifestPath, JSON.stringify(manifestData, null, 2));
    } catch (error) {
      throw new Error(
        `[ucd-store]: Failed to create store manifest: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async _validateAndRepairStore(): Promise<void> {
    throw new Error(
      `[ucd-store]: Validation and repair functionality is not implemented yet. Please implement the _validateAndRepairStore method.`,
    );
    // // Use the repairStore function to validate and repair the store
    // const repairResult = await repairStore(
    //   {
    //     basePath: this.basePath,
    //     versions: this._versions,
    //   },
    //   {
    //     patternMatcher: this.#filter,
    //     concurrency: 5,
    //     fs: this.#fs,
    //   },
    // );

    // // Log results
    // if (repairResult.totalMissingFiles > 0) {
    //   if (repairResult.repairedFiles.length > 0) {
    //     console.warn(`[ucd-store]: Successfully repaired ${repairResult.repairedFiles.length} out of ${repairResult.totalMissingFiles} missing files.`);
    //   }

    //   if (repairResult.errors.length > 0) {
    //     console.warn(`[ucd-store]: ${repairResult.errors.length} files failed to repair:`, repairResult.errors);
    //   }
    // }
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
