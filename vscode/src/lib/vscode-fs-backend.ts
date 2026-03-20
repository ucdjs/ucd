import type { BackendEntry, BackendStat, CopyOptions, ListOptions, RemoveOptions } from "@ucdjs/fs-backend";
import { trimTrailingSlash } from "@luxass/utils";
import { defineBackend } from "@ucdjs/fs-backend";
import { normalizeEntryPath, sortEntries } from "@ucdjs/fs-backend/utils";
import { resolveSafePath } from "@ucdjs/path-utils";
import { FileType, Uri, workspace } from "vscode";
import { z } from "zod";

const LEADING_SLASH_RE = /^\/+/;
const RELATIVE_LEADING_SLASH_RE = /^\/+/;

function normalizeRelativePath(path: string): string {
  const trimmedPath = trimTrailingSlash(path.trim());
  if (!trimmedPath || trimmedPath === "." || trimmedPath === "/") {
    return "";
  }

  return trimmedPath.replace(LEADING_SLASH_RE, "");
}

function createBackendEntry(name: string, type: FileType, relativePath: string): BackendEntry {
  const entryType = type === FileType.Directory ? "directory" : "file";
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
          type: stats.type === FileType.Directory ? "directory" : "file",
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

              if (type === FileType.Directory) {
                await collectEntries(Uri.joinPath(currentUri, name), relativePath);
              }
            }
          } catch {
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
        const parentUri = Uri.joinPath(resolvedUri, "..");

        try {
          await workspace.fs.stat(parentUri);
        } catch {
          await workspace.fs.createDirectory(parentUri);
        }

        await workspace.fs.writeFile(
          resolvedUri,
          typeof data === "string" ? new TextEncoder().encode(data) : data,
        );
      },
      async mkdir(path: string) {
        await workspace.fs.createDirectory(Uri.file(resolvePath(path)));
      },
      async remove(path: string, options?: RemoveOptions) {
        await workspace.fs.delete(Uri.file(resolvePath(path)), {
          recursive: options?.recursive ?? false,
          useTrash: false,
        });
      },
      async copy(sourcePath: string, destinationPath: string, options?: CopyOptions) {
        await workspace.fs.copy(
          Uri.file(resolvePath(sourcePath)),
          Uri.file(resolvePath(destinationPath)),
          {
            overwrite: options?.overwrite ?? true,
          },
        );
      },
    };
  },
});
