import type { UCDStore, UCDStoreOptions } from "./store";
import { buildUCDPath, UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { createClient, type UnicodeVersionFile } from "@luxass/unicode-utils-new/fetch";
import { promiseRetry } from "@luxass/utils";
import { createPathFilter, type FilterFn } from "@ucdjs/utils";
import { flattenFilePaths } from "@ucdjs/utils/ucd-files";
import { resolveUCDStoreOptions } from "./store";

export type RemoteUCDStoreOptions = UCDStoreOptions;

export interface FilterOptions {
  excludePatterns?: string[];
  excludeTest?: boolean;
  excludeDraft?: boolean;
  includeOnly?: string[];
}

export interface DownloadProgress {
  total: number;
  completed: number;
  errors: string[];
}

export interface FileMetadata {
  size: number;
  lastModified?: Date;
}

export interface CacheStats {
  size: number;
  keys: string[];
}

export class RemoteUCDStore implements UCDStore {
  public readonly baseUrl: string;
  public readonly proxyUrl: string;
  #filter: FilterFn;

  private client;

  //             filePath, content
  #FILE_CACHE: Map<string, string> = new Map();

  constructor(options: RemoteUCDStoreOptions = {}) {
    const { baseUrl, filters, proxyUrl } = resolveUCDStoreOptions(options);
    this.baseUrl = baseUrl;
    this.proxyUrl = proxyUrl;

    this.client = createClient(this.baseUrl);

    this.#filter = createPathFilter(filters);
  }

  bootstrap(): void { }

  get versions(): string[] {
    return UNICODE_VERSION_METADATA.map((version) => version.version);
  }

  get fileCache(): Map<string, string> {
    return this.#FILE_CACHE;
  }

  async getFileTree(version: string): Promise<UnicodeVersionFile[]> {
    const { data, error } = await promiseRetry(async () => {
      return await this.client.GET("/api/v1/unicode-files/{version}", {
        params: {
          path: {
            version,
          },
        },
      });
    }, { retries: 3 });

    if (error) {
      throw new Error(`Failed to fetch file structure for version "${version}": ${error.message}`);
    }

    return this.processFileStructure(data);
  }

  async getFile(version: string, filePath: string): Promise<string> {
    if (!this.#filter(filePath)) {
      throw new Error(`File path "${filePath}" is filtered out by the store's filter patterns.`);
    }

    const cacheKey = `${version}/${filePath}`;

    if (this.#FILE_CACHE.has(cacheKey)) {
      return this.#FILE_CACHE.get(cacheKey)!;
    }

    const content = await promiseRetry(async () => {
      const res = await fetch(new URL(buildUCDPath(version, filePath), this.proxyUrl));

      if (!res.ok) {
        throw new Error(`Failed to fetch file "${filePath}" for version "${version}": ${res.status} ${res.statusText}`);
      }

      return res.text();
    }, { retries: 3 });

    this.#FILE_CACHE.set(cacheKey, content);
    return content;
  }

  async hasVersion(version: string): Promise<boolean> {
    return this.versions.includes(version);
  }

  async getFilePaths(version: string): Promise<string[]> {
    const fileStructure = await this.getFileTree(version);
    return flattenFilePaths(fileStructure);
  }

  clearCache(): void {
    this.#FILE_CACHE.clear();
  }

  private processFileStructure(rawStructure: UnicodeVersionFile[]): UnicodeVersionFile[] {
    return rawStructure.map((item) => {
      if (!this.#filter(item.path)) {
        return null;
      }
      return {
        name: item.name,
        path: item.path,
        ...(item.children ? { children: this.processFileStructure(item.children) } : {}),
      };
    }).filter((item) => item != null);
  }
}
