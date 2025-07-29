import { defineFileSystemBridge } from "@ucdjs/fs-bridge";

export const createReadOnlyMockFS = defineFileSystemBridge({
  capabilities: {
    read: true,
    write: false,
    listdir: true,
    mkdir: false,
    exists: true,
    rm: false,
  },
  setup() {
    return {
      async read() {
        return "{}";
      },

      async exists() {
        return true;
      },

      async write() {
        throw new Error("write not supported");
      },

      async listdir() {
        throw new Error("listdir not supported");
      },

      async mkdir() {
        throw new Error("mkdir not supported");
      },

      async stat() {
        throw new Error("stat not supported");
      },

      async rm() {
        throw new Error("rm not supported");
      },
    };
  },
});

export const createMemoryMockFS = defineFileSystemBridge({
  capabilities: {
    read: true,
    write: true,
    listdir: false,
    mkdir: false,
    exists: true,
    rm: false,
  },
  state: {
    map: new Map<string, string>(),
  },
  setup({ state }) {
    return {
      async read(path) {
        const content = state.map.get(path);
        if (content === undefined) {
          throw new Error(`File not found: ${path}`);
        }
        return content;
      },
      async exists(path) {
        return state.map.has(path);
      },
      async listdir() {
        throw new Error("listdir not supported");
      },
      async mkdir(path) {
        state.map.set(path, "");
      },
      async rm(path) {
        state.map.delete(path);
      },
      async write(path, data) {
        state.map.set(path, data);
      },
    };
  },
});
