import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import z from "zod";
import { defineFileSystemBridge } from "../fs-bridge";

async function safeExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

const NodeFileSystemBridge = defineFileSystemBridge({
  optionsSchema: z.object({
    basePath: z.string(),
  }),
  capabilities: {
    exists: true,
    read: true,
    write: true,
    listdir: true,
    mkdir: true,
    rm: true,
  },
  setup({ options }) {
    const basePath = options.basePath;
    return {
      read(path) {
        return readFile(join(basePath, path), "utf-8");
      },
      exists(path) {
        return safeExists(join(basePath, path));
      },
      async listdir(path, recursive) {
        return readdir(join(basePath, path), {
          recursive: recursive ?? false,
        });
      },
      async write(path, data, encoding = "utf-8") {
        const fullPath = join(basePath, path);
        const parentDir = dirname(fullPath);

        if (!(await safeExists(parentDir))) {
          // create parent directories if they don't exist
          await mkdir(parentDir, { recursive: true });
        }

        return writeFile(fullPath, data, { encoding });
      },
      async mkdir(path) {
        // mkdir returns the first directory path, when recursive is true
        await mkdir(join(basePath, path), { recursive: true });
        return void 0;
      },
      async rm(path, options) {
        return rm(join(basePath, path), {
          recursive: options?.recursive ?? false,
          force: options?.force ?? false,
        });
      },
    };
  },
});

export default NodeFileSystemBridge;
