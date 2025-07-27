import type { FSEntry } from "../fs-bridge";
import { joinURL } from "@luxass/utils/path";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { z } from "zod/v4";
import { defineFileSystemBridge } from "../fs-bridge";
import { FileEntrySchema } from "../schemas";

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
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to list directory: ${response.statusText}`);
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
      // should not do anything, as this is a read-only bridge
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
      // read-only bridge, cannot create directories
      },
      async rm() {
      // read-only bridge, cannot remove files or directories
      },
    };
  },
});

export default HTTPFileSystemBridge;
