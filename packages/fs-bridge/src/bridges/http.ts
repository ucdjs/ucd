import type { FSEntry } from "../types";
import { joinURL } from "@luxass/utils/path";
import { createDebugger } from "@ucdjs-internal/shared";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { FileEntrySchema } from "@ucdjs/schemas";
import { z } from "zod";
import { defineFileSystemBridge } from "../define";

const debug = createDebugger("ucdjs:fs-bridge:http");

const API_BASE_URL_SCHEMA = z.codec(z.url({
  protocol: /^https?$/,
  hostname: z.regexes.hostname,
  normalize: true,
}), z.instanceof(URL), {
  decode: (urlString) => new URL(urlString),
  encode: (url) => url.href,
}).default(new URL("/api/v1/files", UCDJS_API_BASE_URL));

const HTTPFileSystemBridge = defineFileSystemBridge({
  meta: {
    name: "HTTP File System Bridge",
    description: "A file system bridge that interacts with a remote HTTP API to perform file system operations.",
  },
  optionsSchema: z.object({
    baseUrl: API_BASE_URL_SCHEMA,
  }),
  setup({ options, resolveSafePath }) {
    const baseUrl = options.baseUrl;

    return {
      async read(path) {
        debug?.("Reading file", { path });

        // Reject file paths ending with / - files don't have trailing slashes
        // Allow /, ./, and ../ as they are special directory references
        const trimmedPath = path.trim();
        if (trimmedPath.endsWith("/") && trimmedPath !== "/" && trimmedPath !== "./" && trimmedPath !== "../") {
          debug?.("Rejected file path ending with '/'", { path });
          throw new Error("Cannot read file: path ends with '/'");
        }

        const url = joinURL(
          baseUrl.origin,
          resolveSafePath(baseUrl.pathname, path),
        );

        debug?.("Fetching remote file", { url });
        const response = await fetch(url);

        if (!response.ok) {
          debug?.("Failed to read remote file", { url, status: response.status, statusText: response.statusText });
          throw new Error(`Failed to read remote file: ${response.statusText}`);
        }

        debug?.("Successfully read remote file", { url });
        return response.text();
      },
      async listdir(path, recursive = false) {
        debug?.("Listing directory", { path, recursive });

        const url = joinURL(
          baseUrl.origin,
          resolveSafePath(baseUrl.pathname, path),
        );

        debug?.("Fetching directory listing", { url });
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            debug?.("Directory not found, returning empty array", { url });
            return [];
          }

          if (response.status === 403) {
            debug?.("Directory access forbidden, returning empty array", { url });
            return [];
          }

          if (response.status === 500) {
            debug?.("Server error while listing directory", { url, status: response.status });
            throw new Error(`Server error while listing directory: ${response.statusText}`);
          }

          debug?.("Failed to list directory", { url, status: response.status, statusText: response.statusText });
          throw new Error(`Failed to list directory: ${response.statusText} (${response.status})`);
        }

        const json = await response.json();

        const result = z.array(FileEntrySchema).safeParse(json);
        if (!result.success) {
          debug?.("Invalid response schema from directory listing", { url, error: result.error.message });
          throw new Error(
            `Invalid response schema: ${result.error.message}`,
          );
        }

        const data = result.data;

        if (!recursive) {
          debug?.("Returning non-recursive directory listing", { path, entryCount: data.length });
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
        debug?.("Processing recursive directory listing", { path, entryCount: data.length });
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

        debug?.("Completed recursive directory listing", { path, totalEntries: entries.length });
        return entries;
      },
      async exists(path) {
        debug?.("Checking file existence", { path });

        const url = joinURL(
          baseUrl.origin,
          resolveSafePath(baseUrl.pathname, path),
        );

        debug?.("Sending HEAD request", { url });
        return fetch(url, { method: "HEAD" })
          .then((response) => {
            debug?.("File existence check result", { url, exists: response.ok });
            return response.ok;
          })
          .catch((err) => {
            // if the error is a msw error, we rethrow it
            // this is useful for testing purposes
            // as it allows us to catch unhandled requests
            if (err instanceof Error && err.message.startsWith("[MSW]")) {
              throw err;
            }

            debug?.("Error checking file existence", { url, error: err instanceof Error ? err.message : String(err) });
            return false;
          });
      },
    };
  },
});

export default HTTPFileSystemBridge;
