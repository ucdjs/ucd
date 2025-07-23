import { UNICODE_PROXY_URL } from "@ucdjs/env";
import { z } from "zod/v4";
import { defineFileSystemBridge } from "../fs-bridge";

const ProxyResponseSchema = z.union([
  z.object({
    type: z.literal("directory"),
    name: z.string(),
    path: z.string(),
    lastModified: z.string(),
  }),
  z.object({
    type: z.literal("file"),
    name: z.string(),
    path: z.string(),
    lastModified: z.string().optional(),
  }),
]);

const HTTPFileSystemBridge = defineFileSystemBridge({
  optionsSchema: z.object({
    baseUrl: z.string(),
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
    const baseUrl = options.baseUrl || UNICODE_PROXY_URL;
    return {
      async read(path) {
        const url = new URL(path, baseUrl);
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Failed to read remote file: ${response.statusText}`);
        }
        return response.text();
      },
      async listdir(path, recursive = false) {
        const url = new URL(path, baseUrl);
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to list directory: ${response.statusText}`);
        }

        const data = await response.json();

        // Validate response data
        const validatedData = z.array(ProxyResponseSchema).parse(data);

        if (!recursive) {
          return validatedData.map((entry) => entry.name);
        }

        // Recursive implementation
        const allEntries = [...validatedData];

        for (const entry of validatedData) {
          if (entry.type === "directory") {
            try {
              const subPath = path.endsWith("/") ? `${path}${entry.name}` : `${path}/${entry.name}`;
              const subEntries = await this.listdir(subPath, true);
              allEntries.push(...subEntries.map((name) => ({ type: "file" as const, name, path: `${subPath}/${name}`, lastModified: undefined })));
            } catch {
            // Skip directories that can't be accessed
              continue;
            }
          }
        }

        return allEntries.map((entry) => entry.name);
      },
      async write() {
      // should not do anything, as this is a read-only bridge
      },
      async exists(path) {
        const url = new URL(path, baseUrl);
        return fetch(url.toString(), { method: "HEAD" })
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
