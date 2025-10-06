import type { FSEntry } from "@ucdjs/fs-bridge";
import type Dirent from "memfs/lib/node/Dirent";
import { dirname, join, relative } from "node:path";
import { trimTrailingSlash } from "@luxass/utils";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { memfs } from "memfs";

export const createReadOnlyMockFS = defineFileSystemBridge({
  setup() {
    return {
      async read() {
        return JSON.stringify({});
      },
      async exists() {
        return true;
      },
      async listdir() {
        return [];
      },
    };
  },
});

export const createMemoryMockFS = defineFileSystemBridge({
  state: {
    fs: memfs().fs,
  },
  setup({ state, resolveSafePath }) {
    return {
      async read(basePath, path) {
        return state.fs.readFileSync(resolveSafePath(basePath, path), "utf8") as string;
      },
      async exists(basePath, path) {
        return state.fs.existsSync(resolveSafePath(basePath, path));
      },
      async listdir(basePath, path, recursive = false) {
        function createFSEntry(entry: Dirent): FSEntry {
          const name = entry.name.toString();
          const pathFromName = trimTrailingSlash(name);
          return entry.isDirectory()
            ? {
                type: "directory",
                name,
                path: pathFromName,
                children: [],
              }
            : {
                type: "file",
                name,
                path: pathFromName,
              };
        }

        if (!recursive) {
          const entries = state.fs.readdirSync(resolveSafePath(basePath, path), { withFileTypes: true }) as Dirent[];
          return entries.map((entry) => createFSEntry(entry));
        }

        const allEntries = state.fs.readdirSync(resolveSafePath(basePath, path), {
          withFileTypes: true,
          recursive: true,
        }) as Dirent[];

        const entryMap = new Map<string, FSEntry>();
        const rootEntries: FSEntry[] = [];

        for (const entry of allEntries) {
          const entryPath = entry.parentPath || entry.path;
          const relativeToTarget = relative(path, entryPath);
          const fsEntry = createFSEntry(entry);

          const entryRelativePath = relativeToTarget
            ? join(relativeToTarget, entry.name.toString())
            : entry.name.toString();

          entryMap.set(entryRelativePath, fsEntry);

          if (!relativeToTarget) {
            rootEntries.push(fsEntry);
          }
        }

        for (const [entryPath, entry] of entryMap) {
          const parentPath = dirname(entryPath);
          if (parentPath && parentPath !== ".") {
            const parent = entryMap.get(parentPath);
            if (parent?.type === "directory") {
              parent.children!.push(entry);
            }
          }
        }

        return rootEntries;
      },
      async mkdir(basePath, path) {
        state.fs.mkdirSync(resolveSafePath(basePath, path));
      },
      async rm(basePath, path) {
        const safePath = resolveSafePath(basePath, path);
        if (safePath === "/" || safePath === "") {
          throw new Error("Cannot remove root directory");
        }

        state.fs.rmSync(safePath);
      },
      async write(basePath, path, data, encoding = "utf8") {
        // ensure the directory exists
        const dir = dirname(path);
        if (!state.fs.existsSync(resolveSafePath(basePath, dir))) {
          state.fs.mkdirSync(resolveSafePath(basePath, dir), { recursive: true });
        }

        state.fs.writeFileSync(resolveSafePath(basePath, path), data, {
          encoding,
        });
      },
    };
  },
});

export function stripChildrenFromEntries<TObj extends { children?: unknown[] }>(entries: TObj[]): Omit<TObj, "children">[] {
  return entries.map((entry) => {
    const { children: _children, ...rest } = entry;
    return rest;
  });
}
