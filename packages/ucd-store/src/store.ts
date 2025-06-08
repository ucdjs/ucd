import type { MaybePromise, Prettify, RemoveIndexSignature } from "@luxass/utils";
import type { FilterFn } from "./filter";
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
): Promise<UCDStore> {
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

  filters?: string[];
}

export interface ValidatedUCDStoreOptions {
  baseUrl: string;
  proxyUrl: string;
  filters: string[];
}

/**
 * Resolves and merges the provided options with default options for UCD store.
 *
 * This function takes user-provided options and combines them with default values
 * to ensure all required configuration is present. It also allows for additional
 * options to be merged via the extras parameter.
 *
 * @template T - Type of additional options to be merged
 * @param {UCDStoreOptions} options - User provided UCD store options
 * @param {T} extras - Additional options to merge with defaults
 * @returns {Prettify<ValidatedUCDStoreOptions & RemoveIndexSignature<T>>} A validated options object with all required fields
 */
export function resolveUCDStoreOptions<T extends Record<string, unknown>>(
  options: UCDStoreOptions,
  extras?: T,
): Prettify<ValidatedUCDStoreOptions & RemoveIndexSignature<T>> {
  const defaults = {
    baseUrl: "https://unicode-api.luxass.dev",
    proxyUrl: "https://unicode-proxy.ucdjs.dev",
    filters: [],
    ...extras,
  };

  return defu(options, defaults) as Prettify<ValidatedUCDStoreOptions & RemoveIndexSignature<T>>;
}

/**
 * Builds a proxy URL by combining the proxy base URL with a path
 * @internal
 */
export function buildProxyUrl(proxyBaseUrl: string, path: string): string {
  return `${proxyBaseUrl}/${path}`;
}

/**
 * Builds an API URL by combining the API base URL with a path
 * @internal
 */
export function buildApiUrl(apiBaseUrl: string, path: string): string {
  return `${apiBaseUrl}/${path}`;
}

export interface UCDStore {
  /**
   * Base URL for the Unicode API
   */
  readonly baseUrl: string;

  /**
   * Proxy URL for the Unicode Files
   */
  readonly proxyUrl: string;

  /**
   * Filters to apply to the Unicode Data Files.
   */
  readonly filterPatterns: string[];

  bootstrap: () => MaybePromise<void>;

  readonly versions: string[];

  getFile: (version: string, filePath: string) => Promise<string>;
  hasVersion: (version: string) => MaybePromise<boolean>;
  getFilePaths: (version: string) => Promise<string[]>;

  getFileTree: (version: string) => Promise<UnicodeVersionFile[]>;
}
