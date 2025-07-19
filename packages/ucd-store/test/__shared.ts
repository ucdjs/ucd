import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { defineFileSystemBridge } from "@ucdjs/utils/fs-bridge";

export function createReadOnlyMockFS(): FileSystemBridge {
  return {
    capabilities: {
      read: true,
      write: false,
      listdir: false,
      mkdir: false,
      stat: false,
      exists: true,
      rm: false,
    },

    async read() {
      return "[]";
    },

    async exists() {
      return true;
    },

    async write(): Promise<never> {
      throw new Error("write not supported");
    },

    async listdir(): Promise<never> {
      throw new Error("listdir not supported");
    },

    async mkdir(): Promise<never> {
      throw new Error("mkdir not supported");
    },

    async stat(): Promise<never> {
      throw new Error("stat not supported");
    },

    async rm(): Promise<never> {
      throw new Error("rm not supported");
    },
  };
}

export function createMemoryMockFS(): FileSystemBridge {
  const memoryFS = new Map<string, string>();

  return defineFileSystemBridge({
    capabilities: {
      read: true,
      write: true,
      listdir: false,
      mkdir: false,
      stat: false,
      exists: true,
      rm: false,
    },

    async read(path: string): Promise<string> {
      const content = memoryFS.get(path);
      if (content === undefined) {
        throw new Error(`File not found: ${path}`);
      }
      return content;
    },

    async write(path: string, data: string): Promise<void> {
      memoryFS.set(path, data);
    },

    async exists(path: string): Promise<boolean> {
      return memoryFS.has(path);
    },

    async listdir(): Promise<never> {
      throw new Error("listdir not supported");
    },

    async mkdir(): Promise<never> {
      throw new Error("mkdir not supported");
    },

    async stat(): Promise<never> {
      throw new Error("stat not supported");
    },

    async rm(): Promise<never> {
      throw new Error("rm not supported");
    },
  });
}
