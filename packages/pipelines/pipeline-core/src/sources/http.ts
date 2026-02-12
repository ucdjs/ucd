import type { FileMetadata, PipelineSourceDefinition, SourceBackend } from "../source";
import type { FileContext } from "../types";
import { definePipelineSource } from "../source";

export interface HttpBackendOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export const UNICODE_ORG_BASE_URL = "https://www.unicode.org/Public/";

export function createHttpBackend(options: HttpBackendOptions): SourceBackend {
  const { baseUrl, headers = {}, timeout = 30000 } = options;
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return {
    async listFiles(version: string): Promise<FileContext[]> {
      throw new Error(
        `HTTP backend does not support listing files. Use a file manifest or provide explicit file list for version ${version}.`,
      );
    },

    async readFile(file: FileContext): Promise<string> {
      const url = `${normalizedBaseUrl}${file.version}/${file.path}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, { headers, signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }
        return response.text();
      } finally {
        clearTimeout(timeoutId);
      }
    },

    async getMetadata(file: FileContext): Promise<FileMetadata> {
      const url = `${normalizedBaseUrl}${file.version}/${file.path}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, { method: "HEAD", headers, signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to get metadata for ${url}: ${response.status}`);
        }
        const contentLength = response.headers.get("content-length");
        const lastModified = response.headers.get("last-modified");
        return {
          size: contentLength ? Number.parseInt(contentLength, 10) : 0,
          lastModified: lastModified || undefined,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
}

export interface HttpSourceOptions extends HttpBackendOptions {
  id?: string;
}

export function createHttpSource(): PipelineSourceDefinition<"http">;
export function createHttpSource<TId extends string>(options: HttpSourceOptions & { id: TId }): PipelineSourceDefinition<TId>;
export function createHttpSource(options?: HttpSourceOptions): PipelineSourceDefinition<string> {
  const id = options?.id ?? "http";
  return definePipelineSource({
    id,
    backend: createHttpBackend(options ?? { baseUrl: "" }),
  });
}

export function createUnicodeOrgSource(): PipelineSourceDefinition<"unicode-org">;
export function createUnicodeOrgSource<TId extends string>(id: TId): PipelineSourceDefinition<TId>;
export function createUnicodeOrgSource(id?: string): PipelineSourceDefinition<string> {
  return createHttpSource({
    id: id ?? "unicode-org",
    baseUrl: UNICODE_ORG_BASE_URL,
  });
}

export const unicodeOrgSource: PipelineSourceDefinition<"unicode-org"> = createUnicodeOrgSource();
