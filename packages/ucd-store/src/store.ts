import path from "node:path";
import { invariant } from "@luxass/utils";
import defu from "defu";

// TODO: find another place for this interface
export interface UnicodeVersionFile {
  name: string;
  path: string;
  children?: UnicodeVersionFile[];
}

export interface UCDStoreOptions {
  /**
   * Base URL for the Unicode API
   *
   * @default "https://unicode-api.luxass.dev/api/v1"
   */
  baseUrl?: string;

  /**
   * Proxy URL for the Unicode API
   *
   * @default "https://unicode-proxy.ucdjs.dev"
   */
  proxyUrl?: string;

  /**
   * Local store configuration:
   * - If undefined or false: Use remote mode
   * - If true: Use local mode with default path
   * - If string: Use local mode with specified path
   */
  local?: boolean | string;

  versions?: string[];
}

export class UCDStore {
  private proxyUrl: string;
  private baseUrl: string;

  public mode: "remote" | "local" = "remote";

  public basePath?: string;
  private fileMap: Map<string, boolean>;
  public isPopulated: boolean = false;
  public readonly versions: ReadonlyArray<string> = [];

  private initializedVersions: ReadonlyArray<string> = [];

  constructor(options: UCDStoreOptions) {
    const { baseUrl, local, versions, proxyUrl } = defu(options, {
      baseUrl: "https://unicode-api.luxass.dev/api/v1",
      proxyUrl: "https://unicode-proxy.ucdjs.dev",
      local: false,
      versions: [],
    });

    this.initializedVersions = versions;

    this.proxyUrl = proxyUrl;
    this.baseUrl = baseUrl;
    if (local) {
      this.mode = "local";
      this.basePath = path.resolve(typeof local === "string" ? local : "./ucd-files");
    }

    this.fileMap = new Map();
  }

  async #prepareLocalStore(): Promise<void> {
    invariant(!this.isPopulated, "Store is already populated. Can't prepare it again.");
    invariant(this.mode === "local", "Store mode must be either 'remote' or 'local'.");

    // verify that basePath is set
    invariant(this.basePath, "Base path must be set for local store.");

    const fsx = await import("fs-extra").then((m) => m.default);
    const path = await import("node:path");

    const basePathExists = await fsx.pathExists(this.basePath);

    if (!basePathExists) {
      // nothing exists at the path, create the base directory and store file
      await fsx.mkdir(this.basePath, { recursive: true });
      const rootStoreFile = path.join(this.basePath, ".ucd-store.json");
      await fsx.writeJson(rootStoreFile, { root: true, versions: this.initializedVersions }, { spaces: 2 });
      return;
    }

    // base path exists, check if it's a valid UCD store
    const rootStoreFile = path.join(this.basePath, ".ucd-store.json");
    const storeFileExists = await fsx.pathExists(rootStoreFile);

    if (!storeFileExists) {
      throw new TypeError(`Invalid UCD store: Missing .ucd-store.json file at ${this.basePath}`);
    }

    try {
      const storeData = await fsx.readJson(rootStoreFile);

      // validate the store file structure
      if (typeof storeData !== "object" || storeData === null) {
        throw new TypeError(`Invalid UCD store: .ucd-store.json is not a valid JSON object`);
      }

      if (!storeData.root) {
        throw new TypeError(`Invalid UCD store: .ucd-store.json missing 'root' property`);
      }

      if (!Array.isArray(storeData.versions)) {
        throw new TypeError(`Invalid UCD store: .ucd-store.json missing or invalid 'versions' property`);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new TypeError(`Invalid UCD store: .ucd-store.json contains invalid JSON`);
      }

      throw error;
    }
  }

  async load(): Promise<void> {
    invariant(!this.isPopulated, "Store is already populated. Can't populate it again.");
    const promise = this.mode === "remote" ? this.#loadRemoteFiles() : this.#loadLocalFiles();

    // Prepare should run before loading files, to
    // ensure that the store is ready for population.
    if (this.mode === "local") {
      await this.#prepareLocalStore();
    }

    await promise;

    this.isPopulated = true;
  }

  async #loadRemoteFiles(): Promise<void> {
    invariant(this.mode === "remote", "Store is not in remote mode. Can't load remote files.");
  }

  async #loadLocalFiles(): Promise<void> {
    invariant(this.mode === "local", "Store is not in local mode. Can't load local files.");
  }
}
