import type { BackendEntry, BackendStat } from "../types";
import { joinURL } from "@luxass/utils/path";
import { createDebugger } from "@ucdjs-internal/shared";
import { UCD_STAT_SIZE_HEADER, UCD_STAT_TYPE_HEADER, UCDJS_STORE_BASE_URL } from "@ucdjs/env";
import { resolveSafePath } from "@ucdjs/path-utils";
import { BackendEntryListSchema } from "@ucdjs/schemas";
import { z } from "zod";
import { defineBackend } from "../define";
import { BackendFileNotFound } from "../errors";
import { assertFilePath, sortEntries } from "../utils";

const debug = createDebugger("ucdjs:fs-backend:http");

export const kHttpBackendSymbol = Symbol.for("@ucdjs/fs-backend:http");

function getBackendStatType(headers: Headers, fallbackPath: string): BackendStat["type"] {
  const typeHeader = headers.get(UCD_STAT_TYPE_HEADER);

  if (typeHeader === "file" || typeHeader === "directory") {
    return typeHeader;
  }

  return fallbackPath.endsWith("/") ? "directory" : "file";
}

function getBackendStatSize(headers: Headers): number {
  const sizeHeader = headers.get(UCD_STAT_SIZE_HEADER) ?? headers.get("content-length");

  if (sizeHeader == null) {
    return 0;
  }

  const parsed = Number.parseInt(sizeHeader, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const API_BASE_URL_SCHEMA = z.union([
  z.url({
    protocol: /^https?$/,
    hostname: z.regexes.hostname,
    normalize: true,
  }),
  z.instanceof(URL),
]).transform((value) => value instanceof URL ? value : new URL(value));

const HTTPFileSystemBackend = defineBackend({
  meta: {
    name: "HTTP File System Backend",
    description: "A read-only file system backend that interacts with a remote HTTP API.",
  },
  optionsSchema: z.object({
    baseUrl: API_BASE_URL_SCHEMA,
  }).default({
    baseUrl: new URL("/", UCDJS_STORE_BASE_URL),
  }),
  symbol: kHttpBackendSymbol,
  setup(options) {
    const baseUrl = options.baseUrl;

    return {
      async read(path) {
        assertFilePath(path);

        const url = joinURL(
          baseUrl.origin,
          resolveSafePath(baseUrl.pathname, path),
        );

        const response = await fetch(url);

        if (response.status === 404) {
          throw new BackendFileNotFound(path);
        }

        if (!response.ok) {
          throw new Error(`Failed to read remote file: ${response.statusText}`);
        }

        return response.text();
      },
      async readBytes(path) {
        assertFilePath(path);

        const url = joinURL(
          baseUrl.origin,
          resolveSafePath(baseUrl.pathname, path),
        );

        const response = await fetch(url);

        if (response.status === 404) {
          throw new BackendFileNotFound(path);
        }

        if (!response.ok) {
          throw new Error(`Failed to read remote file: ${response.statusText}`);
        }

        return new Uint8Array(await response.arrayBuffer());
      },
      async list(path, options) {
        const recursive = options?.recursive ?? false;
        const url = joinURL(
          baseUrl.origin,
          resolveSafePath(baseUrl.pathname, `/${path}`),
        );

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new BackendFileNotFound(path);
          }

          throw new Error(`Failed to list directory: ${response.statusText} (${response.status})`);
        }

        const json = await response.json();
        const result = BackendEntryListSchema.safeParse(json);

        if (!result.success) {
          throw new Error(`Invalid response schema: ${result.error.message}`);
        }

        const data = result.data;

        if (!recursive) {
          return sortEntries(data.map((entry) =>
            entry.type === "directory"
              ? {
                  type: "directory" as const,
                  name: entry.name,
                  path: entry.path,
                  children: [],
                }
              : {
                  type: "file" as const,
                  name: entry.name,
                  path: entry.path,
                }));
        }

        const entries: BackendEntry[] = [];

        for (const entry of data) {
          if (entry.type === "directory") {
            const children = await this.list!(entry.path, { recursive: true });
            entries.push({
              type: "directory",
              name: entry.name,
              path: entry.path,
              children,
            });
            continue;
          }

          entries.push({
            type: "file",
            name: entry.name,
            path: entry.path,
          });
        }

        return sortEntries(entries);
      },
      async exists(path) {
        const url = joinURL(
          baseUrl.origin,
          resolveSafePath(baseUrl.pathname, path),
        );

        return fetch(url, { method: "HEAD" })
          .then((response) => response.ok)
          .catch((error) => {
            if (error instanceof Error && error.message.startsWith("[MSW]")) {
              throw error;
            }

            debug?.("Error checking file existence", {
              url,
              error: error instanceof Error ? error.message : String(error),
            });
            return false;
          });
      },
      async stat(path) {
        const url = joinURL(
          baseUrl.origin,
          resolveSafePath(baseUrl.pathname, path),
        );

        const response = await fetch(url, { method: "HEAD" });

        if (response.status === 404) {
          throw new BackendFileNotFound(path);
        }

        if (!response.ok) {
          throw new Error(`Failed to stat remote path: ${response.statusText} (${response.status})`);
        }

        const lastModified = response.headers.get("last-modified");

        const stat: BackendStat = {
          type: getBackendStatType(response.headers, path),
          size: getBackendStatSize(response.headers),
          mtime: lastModified ? new Date(lastModified) : undefined,
        };

        return stat;
      },
    };
  },
});

export default HTTPFileSystemBackend;
