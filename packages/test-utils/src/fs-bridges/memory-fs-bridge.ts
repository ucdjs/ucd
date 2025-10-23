import type { FileSystemBridgeRmOptions, FSEntry } from "@ucdjs/fs-bridge";
import { Buffer } from "node:buffer";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { createHooks } from "hooxs";
import { z } from "zod";

/**
 * Normalizes root path inputs to an empty string.
 * Treats "", ".", "/" and undefined as the empty root.
 */
function normalizeRootPath(path: string | undefined): string {
  return (!path || path === "." || path === "/") ? "" : path;
}

const stateSchema = z.object({
  files: z.custom<Map<string, string>>(),
});

const errorContextSchema = z.object({
  method: z.enum(["read", "exists", "listdir", "write", "rm", "mkdir"]),
  path: z.string(),
  error: z.instanceof(Error),
  args: z.array(z.unknown()).optional(),
});

// Helper to create a hook with input + state structure
function createHook<TInput extends z.ZodTypeAny, TOutput extends z.ZodTypeAny>(
  inputSchema: TInput,
  outputSchema: TOutput,
): z.ZodFunction<z.ZodTuple<[z.ZodObject<{ input: TInput; state: typeof stateSchema }>], null>, TOutput> {
  return z.function({
    input: [z.object({
      input: inputSchema,
      state: stateSchema,
    })],
    output: outputSchema,
  });
}

// Helper for void or promise<void> output - all hooks are fire-and-forget
const voidOutput = z.union([z.void(), z.promise(z.void())]);

const hooksSchema = z.object({
  // Global error hook
  "on:error": createHook(
    errorContextSchema,
    voidOutput,
  ),

  // Read hooks
  "read:before": createHook(
    z.object({ path: z.string() }),
    voidOutput,
  ),
  "read:after": createHook(
    z.object({ path: z.string(), content: z.string() }),
    voidOutput,
  ),
  "read:error": createHook(
    errorContextSchema,
    voidOutput,
  ),

  // Exists hooks
  "exists:before": createHook(
    z.object({ path: z.string() }),
    voidOutput,
  ),
  "exists:after": createHook(
    z.object({ path: z.string(), exists: z.boolean() }),
    voidOutput,
  ),

  // Listdir hooks
  "listdir:before": createHook(
    z.object({ path: z.string(), recursive: z.boolean().optional() }),
    voidOutput,
  ),
  "listdir:after": createHook(
    z.object({ path: z.string(), recursive: z.boolean().optional(), entries: z.array(z.custom<FSEntry>()) }),
    voidOutput,
  ),

  // Write hooks
  "write:before": createHook(
    z.object({ path: z.string(), data: z.union([z.string(), z.custom<Uint8Array>()]), encoding: z.string().optional() }),
    voidOutput,
  ),
  "write:after": createHook(
    z.object({ path: z.string(), data: z.union([z.string(), z.custom<Uint8Array>()]), encoding: z.string().optional() }),
    voidOutput,
  ),

  // Remove hooks
  "rm:before": createHook(
    z.object({ path: z.string(), options: z.custom<FileSystemBridgeRmOptions>().optional() }),
    voidOutput,
  ),
  "rm:after": createHook(
    z.object({ path: z.string(), options: z.custom<FileSystemBridgeRmOptions>().optional() }),
    voidOutput,
  ),
}).partial();

export type MemoryFSHooks = z.output<typeof hooksSchema>;

export const createMemoryMockFS = defineFileSystemBridge({
  meta: {
    name: "In-Memory File System Bridge",
    description: "A simple in-memory file system bridge using a flat Map for storage, perfect for testing.",
  },
  optionsSchema: z.object({
    initialFiles: z.record(z.string(), z.string()).optional(),
    hooks: hooksSchema.optional(),
  }).optional(),
  state: {
    files: new Map<string, string>(),
  },
  setup({ options, state }) {
    if (options?.initialFiles) {
      for (const [path, content] of Object.entries(options.initialFiles)) {
        state.files.set(path, content);
      }
    }

    const hooks = createHooks<MemoryFSHooks>(options?.hooks || {});

    return {
      read: async (path) => {
        hooks.call("read:before", { input: { path }, state });

        try {
          const content = state.files.get(path);
          if (content === undefined) {
            const error = new Error(`ENOENT: no such file or directory, open '${path}'`);

            hooks.call("read:error", {
              input: {
                method: "read" as const,
                path,
                error,
              },
              state,
            });

            hooks.call("on:error", {
              input: {
                method: "read" as const,
                path,
                error,
              },
              state,
            });

            throw error;
          }

          hooks.call("read:after", { input: { path, content }, state });
          return content;
        } catch (error) {
          if (error instanceof Error) {
            hooks.call("on:error", {
              input: {
                method: "read" as const,
                path,
                error,
              },
              state,
            });
          }

          throw error;
        }
      },
      exists: async (path) => {
        hooks.call("exists:before", { input: { path }, state });

        // fast path for checking direct entry existence
        if (state.files.has(path)) {
          hooks.call("exists:after", { input: { path, exists: true }, state });
          return true;
        }

        // slower path for checking directory existence (implicit - if any file starts with path/)
        const normalizedPath = normalizeRootPath(path);
        const pathWithSlash = normalizedPath === "" ? "" : (normalizedPath.endsWith("/") ? normalizedPath : `${normalizedPath}/`);
        for (const filePath of state.files.keys()) {
          if (filePath.startsWith(pathWithSlash)) {
            hooks.call("exists:after", { input: { path, exists: true }, state });
            return true;
          }
        }

        hooks.call("exists:after", { input: { path, exists: false }, state });
        return false;
      },
      listdir: async (path, recursive) => {
        hooks.call("listdir:before", { input: { path, recursive }, state });

        const normalizedPath = path.endsWith("/") ? path : `${path}/`;
        const entries: FSEntry[] = [];

        for (const filePath of state.files.keys()) {
          if (filePath.startsWith(normalizedPath)) {
            const relativePath = filePath.slice(normalizedPath.length);
            const firstSegment = relativePath.split("/")[0];
            if (firstSegment && !entries.some((e) => e.name === firstSegment)) {
              const hasNestedPath = relativePath.includes("/");
              entries.push(
                hasNestedPath
                  ? {
                      type: "directory",
                      name: firstSegment,
                      path: `${normalizedPath}${firstSegment}`,
                      children: [],
                    }
                  : {
                      type: "file",
                      name: firstSegment,
                      path: `${normalizedPath}${firstSegment}`,
                    },
              );
            }
          }
        }

        hooks.call("listdir:after", { input: { path, recursive, entries }, state });
        return entries;
      },
      write: async (path, data, encoding) => {
        // Before hook
        hooks.call("write:before", { input: { path, data, encoding }, state });

        const content = typeof data === "string" ? data : Buffer.from(data).toString(encoding || "utf-8");
        state.files.set(path, content);

        // After hook
        hooks.call("write:after", { input: { path, data, encoding }, state });
      },
      mkdir: async (_path) => {
        // no-op: directories are implicit in flat Map storage
      },
      rm: async (path, options) => {
        // Before hook
        hooks.call("rm:before", { input: { path, options }, state });

        state.files.delete(path);

        // After hook
        hooks.call("rm:after", { input: { path, options }, state });
      },
    };
  },
});
