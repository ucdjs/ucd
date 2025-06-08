import type { UCDStore, UCDStoreOptions, UnicodeVersionFile } from "./store";
import { hasUCDFolderPath, UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { createClient } from "@luxass/unicode-utils-new/fetch";
import { promiseRetry } from "@luxass/utils";
import { createPathFilter, type FilterFn } from "./filter";
import { buildProxyUrl, resolveUCDStoreOptions } from "./store";

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
  public readonly filterPatterns: string[];
  #filter: FilterFn;

  private client;

  //             filePath, content
  #FILE_CACHE: Map<string, string> = new Map();

  constructor(options: RemoteUCDStoreOptions = {}) {
    const resolvedOptions = resolveUCDStoreOptions(options);
    this.baseUrl = resolvedOptions.baseUrl;
    this.proxyUrl = resolvedOptions.proxyUrl;
    this.filterPatterns = resolvedOptions.filters;

    this.client = createClient(this.baseUrl);

    this.#filter = createPathFilter(this.filterPatterns);
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
      const res = await fetch(buildProxyUrl(this.proxyUrl, `${version}/${hasUCDFolderPath(version) ? "ucd/" : ""}${filePath}`));

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
    return this.flattenFilePaths(fileStructure);
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

  private flattenFilePaths(files: UnicodeVersionFile[], basePath: string = ""): string[] {
    const paths: string[] = [];

    for (const file of files) {
      const fullPath = basePath ? `${basePath}/${file.name}` : file.name;

      if (file.children) {
        paths.push(...this.flattenFilePaths(file.children, fullPath));
      } else {
        paths.push(fullPath);
      }
    }

    return paths;
  }
}
