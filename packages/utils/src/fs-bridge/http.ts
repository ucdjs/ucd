import { z } from "zod/v4";
import { defineFileSystemBridge } from "../fs-bridge";

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
    const baseUrl = options.baseUrl!;
    return {
      async read(path) {
        const url = new URL(path, baseUrl);
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Failed to read remote file: ${response.statusText}`);
        }
        return response.text();
      },
      async listdir(path, _recursive = false) {
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

        const _data = await response.json();

        return [];
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
