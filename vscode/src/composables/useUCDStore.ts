import type { FSEntry } from "@ucdjs/fs-bridge";
import type { UCDStore } from "@ucdjs/ucd-store";
import { trimTrailingSlash } from "@luxass/utils/path";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { createHTTPUCDStore, createUCDStore } from "@ucdjs/ucd-store";
import { createSingletonComposable, ref, watch } from "reactive-vscode";
import { Uri, workspace } from "vscode";
import { z } from "zod";
import { config } from "../config";
import { logger } from "../logger";

const vscodeFSBridge = defineFileSystemBridge({
  optionsSchema: z.object({
    basePath: z.string(),
  }),
  setup({ options, resolveSafePath }) {
    const baseUri = Uri.file(options.basePath);

    return {
      async read(path) {
        const resolvedPath = resolveSafePath(baseUri.fsPath, path);
        const resolvedUri = Uri.file(resolvedPath);
        const uint8Array = await workspace.fs.readFile(resolvedUri);
        return new TextDecoder().decode(uint8Array);
      },
      async exists(path) {
        try {
          const resolvedPath = resolveSafePath(baseUri.fsPath, path);
          const resolvedUri = Uri.file(resolvedPath);
          await workspace.fs.stat(resolvedUri);
          return true;
        } catch {
          return false;
        }
      },
      async listdir(path, recursive = false) {
        const resolvedPath = resolveSafePath(baseUri.fsPath, path);
        const targetUri = Uri.file(resolvedPath);

        function createFSEntry(name: string, type: number, relativePath: string): FSEntry {
          const isDirectory = type === 2; // FileType.Directory
          const pathFromName = trimTrailingSlash(relativePath);

          return isDirectory
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
          const entries = await workspace.fs.readDirectory(targetUri);
          return entries.map(([name, type]) =>
            createFSEntry(name, type, path ? `${path}/${name}` : name),
          );
        }

        // Recursive listing
        const allEntries: Array<{ name: string; type: number; relativePath: string }> = [];

        async function collectEntries(currentUri: Uri, currentPath: string) {
          try {
            const entries = await workspace.fs.readDirectory(currentUri);

            for (const [name, type] of entries) {
              const relativePath = currentPath ? `${currentPath}/${name}` : name;
              allEntries.push({ name, type, relativePath });

              if (type === 2) { // Directory
                const subDirUri = Uri.joinPath(currentUri, name);
                await collectEntries(subDirUri, relativePath);
              }
            }
          } catch {
            // Ignore directories we can't read
          }
        }

        await collectEntries(targetUri, path || "");

        const entryMap = new Map<string, FSEntry>();
        const rootEntries: FSEntry[] = [];

        for (const { name, type, relativePath } of allEntries) {
          const fsEntry = createFSEntry(name, type, relativePath);
          entryMap.set(relativePath, fsEntry);

          // Check if this is a root entry (no parent path)
          const isRoot = !relativePath.includes("/");
          if (isRoot) {
            rootEntries.push(fsEntry);
          }
        }

        // Build the tree structure
        for (const [entryPath, entry] of entryMap) {
          const lastSlashIndex = entryPath.lastIndexOf("/");
          if (lastSlashIndex > 0) {
            const parentPath = entryPath.substring(0, lastSlashIndex);
            const parent = entryMap.get(parentPath);
            if (parent?.type === "directory") {
              parent.children!.push(entry);
            }
          }
        }

        return rootEntries;
      },
      async write(path, data) {
        const resolvedPath = resolveSafePath(baseUri.fsPath, path);
        const resolvedUri = Uri.file(resolvedPath);
        const parentUri = Uri.joinPath(resolvedUri, "..");

        // check if parent directory exists, create if not
        try {
          await workspace.fs.stat(parentUri);
        } catch {
          await workspace.fs.createDirectory(parentUri);
        }

        const uint8Array = typeof data === "string"
          ? new TextEncoder().encode(data)
          : data;
        await workspace.fs.writeFile(resolvedUri, uint8Array);
      },
      async mkdir(path) {
        const resolvedPath = resolveSafePath(baseUri.fsPath, path);
        const resolvedUri = Uri.file(resolvedPath);
        await workspace.fs.createDirectory(resolvedUri);
        return void 0;
      },
      async rm(path, options) {
        const resolvedPath = resolveSafePath(baseUri.fsPath, path);
        const resolvedUri = Uri.file(resolvedPath);
        await workspace.fs.delete(resolvedUri, {
          recursive: options?.recursive ?? false,
          useTrash: false,
        });
      },
    };
  },
});

export const useUCDStore = createSingletonComposable(() => {
  const store = ref<UCDStore | null>(null);

  const createStoreFromConfig = async (localDataFilesStore: string | null): Promise<UCDStore> => {
    // TODO: fix this later
    // by either implementing a "string array to filter patterns (extracts exclude and include from strings)",
    // or making use of both include and exclude in the config
    const globalFilters = /* config["store-filters"] || */ {};
    logger.info("Creating UCD store with config:", { localDataFilesStore, globalFilters });
    if (localDataFilesStore == null || localDataFilesStore.trim() === "") {
      return createHTTPUCDStore({
        globalFilters,
      });
    } else {
      return createUCDStore({
        globalFilters,
        fs: vscodeFSBridge({
          basePath: localDataFilesStore,
        }),
        basePath: localDataFilesStore,
      });
    }
  };

  watch(
    () => config["local-store-path"],
    async (newVal, oldVal) => {
      if (newVal === oldVal) {
        return;
      }

      try {
        store.value = await createStoreFromConfig(newVal);
      } catch (error) {
        console.error("Failed to create UCD store:", error);
        store.value = null;
      }
    },
    { immediate: true },
  );

  return store;
});
