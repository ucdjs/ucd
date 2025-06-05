import type { MaybePromise } from "@luxass/utils";
import type { UCDStore, UCDStoreOptions, UnicodeVersionFile } from "./store";
import path from "node:path";
import { invariant } from "@luxass/utils";
import fsx from "fs-extra";
import { z } from "zod/v4";

import { resolveUCDStoreOptions } from "./store";

export const UCD_STORE_ROOT_SCHEMA = z.object({
  root: z.boolean(),
  versions: z.array(
    z.object({
      version: z.string(),
      path: z.string(),
    }),
  ),
});

export const UCD_STORE_VERSION_SCHEMA = z.object({
  version: z.string(),
  files: z.array(z.string()),
});

export type UCDStoreRootSchema = z.infer<typeof UCD_STORE_ROOT_SCHEMA>;
export type UCDStoreVersionSchema = z.infer<typeof UCD_STORE_VERSION_SCHEMA>;

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
  }

  async bootstrap(): Promise<void> {
    invariant(this.basePath, "Base path is required for LocalUCDStore.");

    await this.#ensureStoreStructure();
    await this.#loadVersions();
  }

  get versions(): string[] {
    return [...this._versions];
  }

  async getFilePaths(version: string): Promise<string[]> {
    if (!this.hasVersion(version)) {
      throw new Error(`Version '${version}' not found in store`);
    }

    const versionPath = this.#getVersionPath(version);
    const manifestPath = path.join(versionPath, ".ucd-version.json");
    const manifest = await this.#readVersionManifest(manifestPath);
    return manifest.files;
  }

  async getFile(version: string, filePath: string): Promise<string> {
    if (!this.hasVersion(version)) {
      throw new Error(`Version '${version}' not found in store`);
    }

    const versionPath = this.#getVersionPath(version);
    const fullPath = path.join(versionPath, filePath);

    if (!(await fsx.pathExists(fullPath))) {
      throw new Error(`File '${filePath}' not found in version '${version}'`);
    }

    return fsx.readFile(fullPath, "utf8");
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

  async #readStoreManifest(manifestPath: string): Promise<UCDStoreRootSchema> {
    const data = await fsx.readJson(manifestPath);

    try {
      return UCD_STORE_ROOT_SCHEMA.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
        throw new Error(`Invalid UCD store manifest: ${issues}`);
      }
      throw new Error("Invalid UCD store: Failed to parse .ucd-store.json");
    }
  }

  async #readVersionManifest(manifestPath: string): Promise<UCDStoreVersionSchema> {
    const data = await fsx.readJson(manifestPath);

    try {
      return UCD_STORE_VERSION_SCHEMA.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
        throw new Error(`Invalid version manifest: ${issues}`);
      }
      throw new Error("Invalid version manifest: Failed to parse .ucd-version.json");
    }
  }

  /**
   * Ensures the store directory structure exists and is valid
   */
  async #ensureStoreStructure(): Promise<void> {
    const basePathExists = await fsx.pathExists(this.basePath);

    if (!basePathExists) {
      await this.#createNewStore();
      return;
    }

    await this.#validateExistingStore();
  }

  /**
   * Creates a new UCD store with the required structure
   */
  async #createNewStore(): Promise<void> {
    await fsx.mkdir(this.basePath, { recursive: true });

    const manifest: UCDStoreRootSchema = {
      root: true,
      versions: [],
    };

    const manifestPath = path.join(this.basePath, ".ucd-store.json");
    await fsx.writeJson(manifestPath, manifest, { spaces: 2 });
  }

  /**
   * Validates an existing UCD store structure
   */
  async #validateExistingStore(): Promise<void> {
    const manifestPath = path.join(this.basePath, ".ucd-store.json");

    if (!(await fsx.pathExists(manifestPath))) {
      throw new Error(`Invalid UCD store: Missing .ucd-store.json file at ${this.basePath}`);
    }

    try {
      const manifest = await this.#readStoreManifest(manifestPath);
      await this.#validateVersionDirectories(manifest.versions);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new TypeError(`Invalid UCD store: .ucd-store.json contains invalid JSON`);
      }
      throw error;
    }
  }

  /**
   * Validates that all version directories exist and are complete
   */
  async #validateVersionDirectories(versions: Array<{ version: string; path: string }>): Promise<void> {
    for (const versionInfo of versions) {
      await this.#validateVersionDirectory(versionInfo);
    }
  }

  /**
   * Validates a specific version directory and its completeness
   */
  async #validateVersionDirectory(versionInfo: { version: string; path: string }): Promise<void> {
    const versionPath = path.join(this.basePath, versionInfo.path);

    if (!(await fsx.pathExists(versionPath))) {
      throw new Error(`Invalid UCD store: Version directory '${versionInfo.version}' does not exist at ${versionPath}`);
    }

    const stats = await fsx.stat(versionPath);
    if (!stats.isDirectory()) {
      throw new Error(`Invalid UCD store: Version path '${versionInfo.version}' exists but is not a directory at ${versionPath}`);
    }

    await this.#validateVersionManifest(versionInfo.version, versionPath);
  }

  /**
   * Validates the version-specific manifest file
   */
  async #validateVersionManifest(version: string, versionPath: string): Promise<void> {
    const versionManifestPath = path.join(versionPath, ".ucd-version.json");

    if (!(await fsx.pathExists(versionManifestPath))) {
      throw new Error(`Invalid UCD store: Version manifest missing for '${version}' at ${versionManifestPath}`);
    }

    try {
      const versionManifest = await this.#readVersionManifest(versionManifestPath);

      if (versionManifest.version !== version) {
        throw new Error(`Invalid version manifest: version mismatch. Expected '${version}', got '${versionManifest.version}'`);
      }

      await this.#validateVersionFiles(versionPath, versionManifest.files);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new TypeError(`Invalid version manifest: .ucd-version.json contains invalid JSON for version '${version}'`);
      }
      throw error;
    }
  }

  /**
   * Validates that all files listed in the version manifest actually exist
   */
  async #validateVersionFiles(versionPath: string, expectedFiles: string[]): Promise<void> {
    for (const filePath of expectedFiles) {
      const fullPath = path.join(versionPath, filePath);

      if (!(await fsx.pathExists(fullPath))) {
        throw new Error(`Missing file: ${filePath} not found at ${fullPath}`);
      }

      const stats = await fsx.stat(fullPath);
      if (!stats.isFile()) {
        throw new Error(`Invalid file: ${filePath} exists but is not a file`);
      }
    }
  }

  /**
   * Loads available versions from the store manifest
   */
  async #loadVersions(): Promise<void> {
    const manifestPath = path.join(this.basePath, ".ucd-store.json");
    const manifest = await this.#readStoreManifest(manifestPath);
    // Extract just the version strings for the public API
    this._versions = manifest.versions.map((v) => v.version);
  }

  /**
   * Creates a version manifest file for a new version
   */
  async #createVersionManifest(version: string, versionPath: string, files: string[]): Promise<void> {
    const manifest: UCDStoreVersionSchema = {
      version,
      files,
    };

    const manifestPath = path.join(versionPath, ".ucd-version.json");
    await fsx.writeJson(manifestPath, manifest, { spaces: 2 });
  }

  /**
   * Gets the absolute path for a version directory
   */
  #getVersionPath(version: string): string {
    // For now, assume version path equals version name (this is the common case)
    // In a more robust implementation, we could read the manifest to get the exact path
    return path.join(this.basePath, version);
  }

  /**
   * Updates the main store manifest to include a new version
   */
  async #addVersionToStore(version: string, relativePath: string): Promise<void> {
    const manifestPath = path.join(this.basePath, ".ucd-store.json");
    const manifest = await this.#readStoreManifest(manifestPath);

    // Check if version already exists
    const existingVersion = manifest.versions.find((v) => v.version === version);
    if (existingVersion) {
      throw new Error(`Version '${version}' already exists in store`);
    }

    manifest.versions.push({ version, path: relativePath });
    await fsx.writeJson(manifestPath, manifest, { spaces: 2 });
  }
}
