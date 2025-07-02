import type { FileSystemBridge } from "../fs-bridge";
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

export interface HTTPFileSystemBridgeOptions {
  baseUrl?: string;
}

/**
 * Creates a read-only file system bridge that interacts with files over HTTP/HTTPS.
 *
 * This bridge allows reading files and listing directories from remote HTTP servers.
 * Write operations (write, mkdir, rm) are not supported as this is a read-only bridge.
 *
 * @param {HTTPFileSystemBridgeOptions} options - Configuration options for the HTTP file system bridge
 * @param {string} options.baseUrl - Optional base URL to resolve relative paths against
 * @returns {FileSystemBridge} A file system bridge implementation for HTTP/HTTPS resources
 */
function HTTPFileSystemBridge(options: HTTPFileSystemBridgeOptions = {}): FileSystemBridge {
  const baseUrl = options.baseUrl || UNICODE_PROXY_URL;
  return defineFileSystemBridge({
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
    async stat(path) {
      const url = new URL(path.startsWith("/") ? `__stat${path}` : `/__stat/${path}`, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to stat path: ${response.statusText}`);
      }

      const data = await response.json();
      const isDirectory = data.type === "directory";

      return {
        isFile: () => !isDirectory,
        isDirectory: () => isDirectory,
        mtime: new Date(data.mtime),
        size: data.size,
      };
    },
  });
}

export default HTTPFileSystemBridge;
