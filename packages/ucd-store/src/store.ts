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
  public versions: ReadonlyArray<string> = [];

  constructor(options: UCDStoreOptions) {
    const { baseUrl, local, proxyUrl } = defu(options, {
      baseUrl: "https://unicode-api.luxass.dev/api/v1",
      proxyUrl: "https://unicode-proxy.ucdjs.dev",
      local: false,
    });

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

    // verify that basePath exists,
    // if it doesn't, create it.

    // if it exists, verify that is has the .ucd-store file.
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    try {
      await fs.access(this.basePath);
    } catch {
      // Base path does not exist, create it
      await fs.mkdir(this.basePath, { recursive: true });
      return;
    }

    // the base path exists beforehand, so we need to check for the .ucd-store file
    const rootStoreFile = path.join(this.basePath, ".ucd-store");
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
