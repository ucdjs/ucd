import type {
  FileContext,
  FileMetadata,
  PipelineSourceDefinition,
  SourceBackend,
} from "@ucdjs/pipelines-core";
import { definePipelineSource } from "@ucdjs/pipelines-core";

export interface HttpBackendOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export function createHttpBackend(options: HttpBackendOptions): SourceBackend {
  const { baseUrl, headers = {}, timeout = 30000 } = options;

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return {
    async listFiles(version: string): Promise<FileContext[]> {
      throw new Error(
        `HTTP backend does not support listing files. `
        + `Use a file manifest or provide explicit file list for version ${version}.`,
      );
    },

    async readFile(file: FileContext): Promise<string> {
      const url = `${normalizedBaseUrl}${file.version}/${file.path}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          headers,
          signal: controller.signal,
        });

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
        const response = await fetch(url, {
          method: "HEAD",
          headers,
          signal: controller.signal,
        });

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

export function createHttpSource<const TId extends string = "http">(
  options: HttpSourceOptions & { id?: TId },
): PipelineSourceDefinition<TId extends undefined ? "http" : TId> {
  const { id = "http" as TId, ...backendOptions } = options;

  return definePipelineSource({
    id: id as TId extends undefined ? "http" : TId,
    backend: createHttpBackend(backendOptions),
  });
}

export const UNICODE_ORG_BASE_URL = "https://www.unicode.org/Public/";

export function createUnicodeOrgSource<const TId extends string = "unicode-org">(
  id?: TId,
): PipelineSourceDefinition<TId extends undefined ? "unicode-org" : TId> {
  return createHttpSource({
    id: (id ?? "unicode-org") as TId extends undefined ? "unicode-org" : TId,
    baseUrl: UNICODE_ORG_BASE_URL,
  });
}

export const unicodeOrgSource = createUnicodeOrgSource();
