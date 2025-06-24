import { defineFileSystemBridge, type FileSystemBridge } from "../fs-bridge";

// MAYBE align this with the UCD Store's default base URL constants?
const DEFAULT_BASE_URL = "https://unicode-api.luxass.dev/api/v1";

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
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  return defineFileSystemBridge({
    async read(path) {
      const url = new URL(path, baseUrl);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to read remote file: ${response.statusText}`);
      }
      return response.text();
    },
    async listdir(path, _recursive) {
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
      return data.files;
    },
    async write() {
      // should not do anything, as this is a read-only bridge
    },
    async exists(path) {
      const url = new URL(path, baseUrl);
      return fetch(url.toString(), { method: "HEAD" })
        .then((response) => response.ok)
        .catch(() => false);
    },
    async mkdir() {
      // read-only bridge, cannot create directories
    },
    async rm() {
      // read-only bridge, cannot remove files or directories
    },
    async stat(_path) {
      throw new Error("Stat operation is not supported in HTTPFileSystemBridge");
    },
  });
}

export default HTTPFileSystemBridge;
