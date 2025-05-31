import defu from "defu";

export interface UCDStoreOptions {
  /**
   * API URL for fetching Unicode data in HTTP mode
   * @default "https://unicode-api.luxass.dev/api/v1"
   */
  apiUrl?: string;

  /**
   * API Proxy Url for fetching UCD Files
   * @default "https://unicode-proxy.ucdjs.dev"
   */
  unicodeProxyUrl?: string;

  /**
   * Concurrency limit for downloading files
   * @default 3
   */
  concurrency?: number;

  /**
   * Path to the directory where you want to store the Unicode data files.
   * If set to `true`, it will use current working directory, combined with `ucd-files`
   */
  localPath?: boolean;
}

export const DEFAULT_STORE_OPTIONS: UCDStoreOptions = {
  apiUrl: "https://unicode-api.luxass.dev/api",
  unicodeProxyUrl: "https://unicode-proxy.ucdjs.dev",
  concurrency: 3,
  localPath: false,
};

export class UCDStore {
  /**
   * Options for the UCDStore instance.
   */
  public options: UCDStoreOptions;

  constructor(options: UCDStoreOptions) {
    this.options = defu(options, DEFAULT_STORE_OPTIONS);
  }
}
