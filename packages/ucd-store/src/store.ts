import type { MaybePromise } from "@luxass/utils";
import type { LocalUCDStore, LocalUCDStoreOptions } from "./local";
import type { RemoteUCDStore, RemoteUCDStoreOptions } from "./remote";
import { invariant } from "@luxass/utils";
import defu from "defu";

// TODO: find another place for this interface
export interface UnicodeVersionFile {
  name: string;
  path: string;
  children?: UnicodeVersionFile[];
}

export interface CreateUCDStoreOptions {
  mode?: "remote" | "local";
}

export async function createUCDStore(mode: "local", options?: LocalUCDStoreOptions): Promise<LocalUCDStore>;
export async function createUCDStore(mode: "remote", options?: RemoteUCDStoreOptions): Promise<RemoteUCDStore>;
export async function createUCDStore<TMode extends "remote" | "local">(
  mode: TMode,
  options?: RemoteUCDStoreOptions | LocalUCDStoreOptions,
): Promise<BaseUCDStore> {
  invariant(mode === "remote" || mode === "local", `Invalid mode: ${mode}. Expected "remote" or "local".`);

  let store = null;

  if (mode === "local") {
    const { LocalUCDStore } = await import("./local");
    store = new LocalUCDStore(options);
  } else {
    const { RemoteUCDStore } = await import("./remote");
    store = new RemoteUCDStore(options);
  }

  invariant(store !== null, `[ucd-store]: Failed to create UCD store for mode: ${mode}.`);

  await store.bootstrap();

  return store;
}

export interface BaseUCDStoreOptions {
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

  filters?: string[];
}

export abstract class BaseUCDStore {
  /**
   * Base URL for the Unicode API
   */
  protected baseUrl: string;

  /**
   * Proxy URL for the Unicode Files
   */
  protected proxyUrl: string;

  /**
   * Filters to apply to the Unicode Data Files.
   */
  private filters: string[] = [];

  /**
   * Whether or not the store is populated with data.
   */
  public isPopulated: boolean = false;

  constructor(options: BaseUCDStoreOptions = {}) {
    const { baseUrl, proxyUrl } = defu(options, {
      baseUrl: "https://unicode-api.luxass.dev/api/v1",
      proxyUrl: "https://unicode-proxy.ucdjs.dev",
    });

    this.proxyUrl = proxyUrl;
    this.baseUrl = baseUrl;
  }

  abstract bootstrap(): MaybePromise<void>;

  abstract get versions(): string[];

  abstract getFile(version: string, filePath: string): Promise<string>;
  abstract hasVersion(version: string): MaybePromise<boolean>;
  abstract getFilePaths(version: string): Promise<string[]>;

  buildProxyUrl(path: string): string {
    return `${this.proxyUrl}/${path}`;
  }

  buildApiUrl(path: string): string {
    return `${this.baseUrl}/${path}`;
  }
}
