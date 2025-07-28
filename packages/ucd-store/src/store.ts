import type { UCDClient } from "@ucdjs/fetch";
import type { FileSystemBridgeOperationsWithSymbol } from "@ucdjs/fs-bridge";
import type { PathFilter } from "@ucdjs/utils";
import type { StoreCapabilities, UCDStoreOptions } from "./types";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createClient } from "@ucdjs/fetch";
import { createPathFilter } from "@ucdjs/utils";
import defu from "defu";
import { join } from "pathe";
import { UCDStoreError } from "./errors";
import { inferStoreCapabilities } from "./internal/capabilities";

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
  #fs: FileSystemBridgeOperationsWithSymbol;
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

    if (fs == null) {
      throw new UCDStoreError("FileSystemBridge instance is required to create a UCDStore.");
    }

    this.baseUrl = baseUrl;
    this.basePath = basePath;
    this.#client = createClient(this.baseUrl);
    this.#filter = createPathFilter(globalFilters);
    this.#fs = fs as FileSystemBridgeOperationsWithSymbol;
    this.#capabilities = inferStoreCapabilities(this.#fs);

    this.#manifestPath = join(this.basePath, ".ucd-store.json");
  }

  /**
   * Gets the filesystem bridge instance used by this store.
   *
   * The filesystem bridge provides an abstraction layer for file system operations,
   * allowing the store to work with different storage backends (local filesystem,
   * remote HTTP, in-memory, etc.) through a unified interface.
   *
   * @returns {FileSystemBridgeOperations} The FileSystemBridge instance configured for this store
   */
  get fs(): FileSystemBridgeOperationsWithSymbol {
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

  /**
   * Gets the capabilities of this store instance.
   *
   * Capabilities determine what operations the store can perform based on the
   * underlying filesystem bridge's features. This includes operations like
   * mirroring, cleaning, analyzing, and repairing.
   *
   * @returns {StoreCapabilities} A frozen copy of the store's capabilities object
   * to prevent external modification
   */
  get capabilities(): StoreCapabilities {
    return Object.freeze({ ...this.#capabilities });
  }

  /**
   * Initialize the store - loads existing data or creates new structure
   */
  async initialize(): Promise<void> {}
}
