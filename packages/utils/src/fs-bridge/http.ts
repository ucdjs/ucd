import { joinURL } from "@luxass/utils/path";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { z } from "zod/v4";
import { defineFileSystemBridge } from "../fs-bridge";

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
      async listdir(path, _recursive = false) {
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

        const _data = await response.json();

        return [];
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
