import type { BaseUCDStoreOptions, UnicodeVersionFile } from "./store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { invariant } from "@luxass/utils";
import { fetchWithRetry } from "@ucdjs/utils";
import { BaseUCDStore } from "./store";

export type RemoteUCDStoreOptions = BaseUCDStoreOptions;

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

export class RemoteUCDStore extends BaseUCDStore {
  //                      filePath, content
  private FILE_CACHE: Map<string, string> = new Map();

  constructor(options: RemoteUCDStoreOptions = {}) {
    super(options);
  }

  bootstrap(): void {}

  get versions(): string[] {
    return UNICODE_VERSION_METADATA.map((version) => version.version);
  }

  get fileCache(): Map<string, string> {
    return this.FILE_CACHE;
  }

  async getFileStructure(version: string): Promise<UnicodeVersionFile[]> {
    const url = this.buildApiUrl(`unicode-files/${version}`);
    const response = await fetchWithRetry(url);
    const rawStructure = await response.json() as UnicodeVersionFile[];
    return this.processFileStructure(rawStructure);
  }

  async getFile(version: string, filePath: string): Promise<string> {
    const cacheKey = `${version}/${filePath}`;

    if (this.FILE_CACHE.has(cacheKey)) {
      return this.FILE_CACHE.get(cacheKey)!;
    }

    const url = this.buildProxyUrl(`${version}/${filePath}`);
    const response = await fetchWithRetry(url);
    const content = await response.text();

    this.FILE_CACHE.set(cacheKey, content);
    return content;
  }

  async hasVersion(version: string): Promise<boolean> {
    return this.versions.includes(version);
  }

  async getFilePaths(version: string): Promise<string[]> {
    const fileStructure = await this.getFileStructure(version);
    return this.flattenFilePaths(fileStructure);
  }

  clearCache(): void {
    this.FILE_CACHE.clear();
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
