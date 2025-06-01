import type { MaybePromise } from "@luxass/utils";
import type { UCDStore, UCDStoreOptions, UnicodeVersionFile, ValidatedUCDStoreOptions } from "./store";
import path from "node:path";
import { invariant } from "@luxass/utils";
import { resolveUCDStoreOptions } from "./store";

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

  constructor(options: LocalUCDStoreOptions = {}) {
    const {
      baseUrl,
      proxyUrl,
      filters,
      basePath,
    } = resolveUCDStoreOptions(options, {
      basePath: path.resolve("./ucd-files"),
    });

    this.baseUrl = baseUrl;
    this.proxyUrl = proxyUrl;
    this.filters = filters;
    this.basePath = basePath;
  }

  bootstrap(): Promise<void> {
    invariant(this.basePath, "Base path is required for LocalUCDStore.");

    return Promise.resolve();
  }

  get versions(): string[] {
    throw new Error("Method not implemented.");
  }

  getFilePaths(_version: string): Promise<string[]> {
    throw new Error("Method not implemented.");
  }

  getFile(_version: string, _filePath: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

  hasVersion(_version: string): MaybePromise<boolean> {
    throw new Error("Method not implemented.");
  }

  getFileTree(_version: string): Promise<UnicodeVersionFile[]> {
    throw new Error("Method not implemented.");
  }

  // async #prepareLocalStore(): Promise<void> {
  //   invariant(!this.isPopulated, "Store is already populated. Can't prepare it again.");

  //   const basePathExists = await fsx.pathExists(this.basePath);

  //   if (!basePathExists) {
  //     // nothing exists at the path, create the base directory and store file
  //     await fsx.mkdir(this.basePath, { recursive: true });
  //     const rootStoreFile = path.join(this.basePath, ".ucd-store.json");
  //     await fsx.writeJson(rootStoreFile, { root: true, versions: this.initializedVersions }, { spaces: 2 });
  //     return;
  //   }

  //   // base path exists, check if it's a valid UCD store
  //   const rootStoreFile = path.join(this.basePath, ".ucd-store.json");
  //   const storeFileExists = await fsx.pathExists(rootStoreFile);

  //   if (!storeFileExists) {
  //     throw new TypeError(`Invalid UCD store: Missing .ucd-store.json file at ${this.basePath}`);
  //   }

  //   try {
  //     const storeData = await fsx.readJson(rootStoreFile);

  //     // validate the store file structure
  //     if (typeof storeData !== "object" || storeData === null) {
  //       throw new TypeError(`Invalid UCD store: .ucd-store.json is not a valid JSON object`);
  //     }

  //     if (!storeData.root) {
  //       throw new TypeError(`Invalid UCD store: .ucd-store.json missing 'root' property`);
  //     }

  //     if (!Array.isArray(storeData.versions)) {
  //       throw new TypeError(`Invalid UCD store: .ucd-store.json missing or invalid 'versions' property`);
  //     }

  //     // Verify that all versions in the store actually exist
  //     await this.#verifyVersionsExist(storeData);
  //   } catch (error) {
  //     if (error instanceof SyntaxError) {
  //       throw new TypeError(`Invalid UCD store: .ucd-store.json contains invalid JSON`);
  //     }

  //     throw error;
  //   }
  // }

  // async load(): Promise<void> {
  //   invariant(!this.isPopulated, "Store is already populated. Can't populate it again.");

  //   // Prepare should run before loading files, to
  //   // ensure that the store is ready for population.
  //   await this.#prepareLocalStore();

  //   await this.#loadLocalFiles();

  //   this.isPopulated = true;
  // }

  // async #loadLocalFiles(): Promise<void> {
  //   // Implementation for loading local files
  // }

  // async #verifyVersionsExist(storeData: { versions: string[] }): Promise<void> {
  //   for (const version of storeData.versions) {
  //     const versionPath = path.join(this.basePath, version);
  //     const versionExists = await fsx.pathExists(versionPath);

  //     if (!versionExists) {
  //       throw new TypeError(`Invalid UCD store: Version directory '${version}' does not exist at ${versionPath}`);
  //     }

  //     // Check if it's actually a directory
  //     const stats = await fsx.stat(versionPath);
  //     if (!stats.isDirectory()) {
  //       throw new TypeError(`Invalid UCD store: Version path '${version}' exists but is not a directory at ${versionPath}`);
  //     }

  //     // Optionally verify the version directory contains expected files
  //     // This could be expanded to check for specific Unicode data files
  //     const versionContents = await fsx.readdir(versionPath);
  //     if (versionContents.length === 0) {
  //       throw new TypeError(`Invalid UCD store: Version directory '${version}' is empty at ${versionPath}`);
  //     }
  //   }
  // }
}
