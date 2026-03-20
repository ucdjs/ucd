import type { BackendEntry, BackendStat, CopyOptions, ListOptions, RemoveOptions } from "@ucdjs/fs-backend";
import nodePath from "node:path";
import { trimTrailingSlash } from "@luxass/utils";
import {
  BackendEntryIsDirectory,
  CopyDestinationAlreadyExistsError,
  defineBackend,
} from "@ucdjs/fs-backend";
import { normalizeEntryPath, normalizePathSeparators, sortEntries } from "@ucdjs/fs-backend/utils";
import { resolveSafePath } from "@ucdjs/path-utils";
import { FileType, Uri, workspace } from "vscode";
import { z } from "zod";

const LEADING_SLASH_RE = /^\/+/;
const RELATIVE_LEADING_SLASH_RE = /^\/+/;

function isDirectory(type: FileType): boolean {
  return (type & FileType.Directory) === FileType.Directory;
}

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === code;
}

function isFileNotFoundError(error: unknown): boolean {
  return hasErrorCode(error, "FileNotFound")
    || (error instanceof Error && (
      error.name.includes("FileNotFound")
      || error.message.includes("FileNotFound")
    ));
}

function normalizeRelativePath(path: string): string {
  const trimmedPath = trimTrailingSlash(path.trim());
  if (!trimmedPath || trimmedPath === "." || trimmedPath === "/") {
    return "";
  }

  return trimmedPath.replace(LEADING_SLASH_RE, "");
}

function createBackendEntry(name: string, type: FileType, relativePath: string): BackendEntry {
  const entryType = isDirectory(type) ? "directory" : "file";
  const normalizedPath = normalizeEntryPath(relativePath, entryType);

  return entryType === "directory"
    ? {
        type: entryType,
        name,
        path: normalizedPath,
        children: [],
      }
    : {
        type: entryType,
        name,
        path: normalizedPath,
      };
}

export const vscodeFSBackend = defineBackend({
  meta: {
    name: "VSCode File System Backend",
    description: "A filesystem backend built on top of VS Code's workspace.fs API.",
  },
  optionsSchema: z.object({
    basePath: z.string().trim().min(1, "basePath is required"),
  }),
  setup(options) {
    const baseUri = Uri.file(options.basePath);

    const resolvePath = (path: string): string => resolveSafePath(baseUri.fsPath, path);
    const toRelativePath = (absolutePath: string): string => normalizePathSeparators(nodePath.relative(baseUri.fsPath, absolutePath));
    const toCanonicalPath = (absolutePath: string, type: BackendEntry["type"]): string =>
      normalizeEntryPath(toRelativePath(absolutePath), type);
    const safeStat = async (uri: Uri): Promise<FileType | null> => {
      try {
        return (await workspace.fs.stat(uri)).type;
      } catch (error) {
        if (isFileNotFoundError(error)) {
          return null;
        }

        throw error;
      }
    };
    const ensureParentDirectory = async (uri: Uri): Promise<void> => {
      const parentUri = Uri.file(nodePath.dirname(uri.fsPath));
      if (parentUri.fsPath === uri.fsPath) {
        return;
      }

      try {
        await workspace.fs.stat(parentUri);
      } catch {
        await workspace.fs.createDirectory(parentUri);
      }
    };

    return {
      async read(path: string) {
        const content = await workspace.fs.readFile(Uri.file(resolvePath(path)));
        return new TextDecoder().decode(content);
      },
      async readBytes(path: string) {
        const content = await workspace.fs.readFile(Uri.file(resolvePath(path)));
        return new Uint8Array(content);
      },
      async exists(path: string) {
        try {
          await workspace.fs.stat(Uri.file(resolvePath(path)));
          return true;
        } catch {
          return false;
        }
      },
      async stat(path: string): Promise<BackendStat> {
        const stats = await workspace.fs.stat(Uri.file(resolvePath(path)));
        return {
          type: isDirectory(stats.type) ? "directory" : "file",
          size: stats.size,
          mtime: stats.mtime ? new Date(stats.mtime) : undefined,
        };
      },
      async list(path: string, options?: ListOptions) {
        const recursive = options?.recursive ?? false;
        const resolvedPath = resolvePath(path);
        const targetUri = Uri.file(resolvedPath);
        const requestedPath = normalizeRelativePath(path);

        if (!recursive) {
          const entries = await workspace.fs.readDirectory(targetUri);
          return sortEntries(entries.map(([name, type]) =>
            createBackendEntry(
              name,
              type,
              requestedPath ? `${requestedPath}/${name}` : name,
            ),
          ));
        }

        const allEntries: Array<{ name: string; type: FileType; relativePath: string }> = [];

        async function collectEntries(currentUri: Uri, currentPath: string): Promise<void> {
          try {
            const entries = await workspace.fs.readDirectory(currentUri);

            for (const [name, type] of entries) {
              const relativePath = currentPath ? `${currentPath}/${name}` : name;
              allEntries.push({ name, type, relativePath });

              if (isDirectory(type)) {
                await collectEntries(Uri.joinPath(currentUri, name), relativePath);
              }
            }
          } catch (error) {
            if (currentUri.toString() === targetUri.toString()) {
              throw error;
            }

            // Ignore directories we can't read.
          }
        }

        await collectEntries(targetUri, requestedPath);

        const entryMap = new Map<string, BackendEntry>();
        const rootEntries: BackendEntry[] = [];

        for (const { name, type, relativePath } of allEntries) {
          const entry = createBackendEntry(name, type, relativePath);
          entryMap.set(relativePath, entry);

          if (!relativePath.slice(requestedPath.length).replace(RELATIVE_LEADING_SLASH_RE, "").includes("/")) {
            rootEntries.push(entry);
          }
        }

        for (const [entryPath, entry] of entryMap) {
          const parentPath = entryPath.includes("/")
            ? entryPath.slice(0, entryPath.lastIndexOf("/"))
            : "";

          if (!parentPath || parentPath === requestedPath) {
            continue;
          }

          const parent = entryMap.get(parentPath);
          if (parent?.type === "directory") {
            parent.children.push(entry);
          }
        }

        return sortEntries(rootEntries);
      },
      async write(path: string, data: string | Uint8Array) {
        const resolvedUri = Uri.file(resolvePath(path));
        await ensureParentDirectory(resolvedUri);

        await workspace.fs.writeFile(
          resolvedUri,
          typeof data === "string" ? new TextEncoder().encode(data) : data,
        );
      },
      async mkdir(path: string) {
        await workspace.fs.createDirectory(Uri.file(resolvePath(path)));
      },
      async remove(path: string, options?: RemoveOptions) {
        try {
          await workspace.fs.delete(Uri.file(resolvePath(path)), {
            recursive: options?.recursive ?? false,
            useTrash: false,
          });
        } catch (error) {
          if (options?.force === true && isFileNotFoundError(error)) {
            return;
          }

          throw error;
        }
      },
      async copy(sourcePath: string, destinationPath: string, options?: CopyOptions) {
        const sourceUri = Uri.file(resolvePath(sourcePath));
        const sourceStats = await workspace.fs.stat(sourceUri);
        const sourceIsDirectory = isDirectory(sourceStats.type);

        if (sourceIsDirectory && options?.recursive !== true) {
          throw new BackendEntryIsDirectory(sourcePath);
        }

        const destinationUri = Uri.file(resolvePath(destinationPath));
        const destinationType = await safeStat(destinationUri);
        const destinationActsAsDirectory = !sourceIsDirectory
          && (destinationPath.trim().endsWith("/") || (destinationType != null && isDirectory(destinationType)));
        const resolvedCopyDestinationUri = destinationActsAsDirectory
          ? Uri.file(nodePath.join(destinationUri.fsPath, nodePath.basename(sourceUri.fsPath)))
          : destinationUri;
        const copyDestinationType = await safeStat(resolvedCopyDestinationUri);
        const copyDestinationPath = toCanonicalPath(
          resolvedCopyDestinationUri.fsPath,
          sourceIsDirectory ? "directory" : "file",
        );

        if (options?.overwrite === false && copyDestinationType != null) {
          throw new CopyDestinationAlreadyExistsError(copyDestinationPath);
        }

        await ensureParentDirectory(resolvedCopyDestinationUri);
        await workspace.fs.copy(
          sourceUri,
          resolvedCopyDestinationUri,
          {
            overwrite: options?.overwrite ?? true,
          },
        );
      },
    };
  },
});
