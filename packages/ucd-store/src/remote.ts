import type { UCDStore, UCDStoreOptions, UnicodeVersionFile } from "./store";
import { hasUCDFolderPath, UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { promiseRetry } from "@luxass/utils";
import { buildApiUrl, buildProxyUrl, resolveUCDStoreOptions } from "./store";

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
  public readonly filters: string[];

  //                      filePath, content
  #FILE_CACHE: Map<string, string> = new Map();

  constructor(options: RemoteUCDStoreOptions = {}) {
    const resolvedOptions = resolveUCDStoreOptions(options);
    this.baseUrl = resolvedOptions.baseUrl;
    this.proxyUrl = resolvedOptions.proxyUrl;
    this.filters = resolvedOptions.filters;
  }

  bootstrap(): void {}

  get versions(): string[] {
    return UNICODE_VERSION_METADATA.map((version) => version.version);
  }

  get fileCache(): Map<string, string> {
    return this.#FILE_CACHE;
  }

  async getFileTree(version: string): Promise<UnicodeVersionFile[]> {
    const url = buildApiUrl(this.baseUrl, `unicode-files/${version}`);
    const response = await fetchWithRetry(url);
    const rawStructure = await response.json() as UnicodeVersionFile[];
    return this.processFileStructure(rawStructure);
  }

  async getFile(version: string, filePath: string): Promise<string> {
    const cacheKey = `${version}/${filePath}`;

    if (this.#FILE_CACHE.has(cacheKey)) {
      return this.#FILE_CACHE.get(cacheKey)!;
    }

    const url = buildProxyUrl(this.proxyUrl, `${version}/${hasUCDFolderPath(version) ? "ucd/" : ""}${filePath}`);
    const response = await fetchWithRetry(url);
    const content = await response.text();

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

  private processFileStructure(rawStructure: any[]): UnicodeVersionFile[] {
    return rawStructure.map((item) => ({
      name: item.name,
      path: item.path,
      children: item.children ? this.processFileStructure(item.children) : undefined,
    }));
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

async function fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
  return promiseRetry(
    async () => {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    },
    {
      retries: 3,
    },
  );
}
