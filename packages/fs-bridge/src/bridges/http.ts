import type { FSEntry } from "../types";
import { joinURL } from "@luxass/utils/path";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { FileEntrySchema } from "@ucdjs/schemas";
import { z } from "zod";
import { defineFileSystemBridge } from "../define";

const HTTPFileSystemBridge = defineFileSystemBridge({
  optionsSchema: z.object({
    baseUrl: z.string().default(joinURL(UCDJS_API_BASE_URL, "/api/v1/files")),
  }),
  capabilities: {
    exists: true,
    read: true,
    write: false,
    listdir: true,
    mkdir: false,
    rm: false,
  },
  setup({ options }) {
    const baseUrl = options.baseUrl;
    return {
      async read(path) {
        const url = joinURL(baseUrl, path);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to read remote file: ${response.statusText}`);
        }
        return response.text();
      },
      async listdir(path, recursive = false) {
        const url = joinURL(baseUrl, path);
        console.error("Listing directory at URL:", url, baseUrl, path);
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
            console.error(`Access denied to directory: ${path}`);
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
            const children = await this.listdir(entry.path, true);
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
      async write() {
        // This method is intentionally left unimplemented because this is a read-only bridge.
      },
      async exists(path) {
        const url = joinURL(baseUrl, path);
        return fetch(url, { method: "HEAD" })
          .then((response) => {
            return response.ok;
          })
          .catch(() => false);
      },
      async mkdir() {
        // This method is intentionally left unimplemented because this is a read-only bridge.
      },
      async rm() {
        // This method is intentionally left unimplemented because this is a read-only bridge.
      },
    };
  },
});

export default HTTPFileSystemBridge;
