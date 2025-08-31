import type { FSEntry } from "../types";
import { joinURL } from "@luxass/utils/path";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { FileEntrySchema } from "@ucdjs/schemas";
import { z } from "zod";
import { defineFileSystemBridge } from "../define";

const API_BASE_URL_SCHEMA = z.codec(z.httpUrl(), z.instanceof(URL), {
  decode: (urlString) => new URL(urlString),
  encode: (url) => url.href,
}).default(new URL("/api/v1/files", UCDJS_API_BASE_URL));

const HTTPFileSystemBridge = defineFileSystemBridge({
  optionsSchema: z.object({
    baseUrl: API_BASE_URL_SCHEMA,
  }),
  setup({ options, resolveSafePath }) {
    const baseUrl = options.baseUrl;

    return {
      async read(path) {
        const url = joinURL(
          baseUrl.origin,
          resolveSafePath(baseUrl.pathname, path),
        );

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to read remote file: ${response.statusText}`);
        }
        return response.text();
      },
      async listdir(path, recursive = false) {
        const url = joinURL(
          baseUrl.origin,
          resolveSafePath(baseUrl.pathname, path),
        );

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            return [];
          }

          if (response.status === 403) {
            return [];
          }

          if (response.status === 500) {
            throw new Error(`Server error while listing directory: ${response.statusText}`);
          }

          throw new Error(`Failed to list directory: ${response.statusText} (${response.status})`);
        }

        const json = await response.json();

        const result = z.array(FileEntrySchema).safeParse(json);
        if (!result.success) {
          throw new Error(
            `Invalid response schema: ${result.error.message}`,
          );
        }

        const data = result.data;

        if (!recursive) {
          return data.map((entry) => {
            if (entry.type === "directory") {
              return {
                type: "directory",
                name: entry.name,
                path: entry.path,
                children: [],
              };
            }

            return {
              type: entry.type,
              name: entry.name,
              path: entry.path,
            };
          });
        }

        // If recursive, we assume the API returns all entries in a flat structure
        // So we can just loop through the entries,
        // and if we encounter a directory, we can fetch their children
        const entries: FSEntry[] = [];
        for (const entry of data) {
          if (entry.type === "directory") {
            const children = await this.listdir!(
              joinURL(path, entry.path),
              true,
            );

            entries.push({
              type: "directory",
              name: entry.name,
              path: entry.path,
              children,
            });
          } else {
            entries.push({
              type: "file",
              name: entry.name,
              path: entry.path,
            });
          }
        }

        return entries;
      },
      async exists(path) {
        const url = joinURL(
          baseUrl.origin,
          resolveSafePath(baseUrl.pathname, path),
        );

        return fetch(url, { method: "HEAD" })
          .then((response) => {
            return response.ok;
          })
          .catch((err) => {
            // if the error is a msw error, we rethrow it
            // this is useful for testing purposes
            // as it allows us to catch unhandled requests
            if (err instanceof Error && err.message.startsWith("[MSW]")) {
              throw err;
            }

            return false;
          });
      },
    };
  },
});

export default HTTPFileSystemBridge;
