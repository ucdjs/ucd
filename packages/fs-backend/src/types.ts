import type { BackendEntry as SchemasBackendEntry } from "@ucdjs/schemas";
import type { HookableCore } from "hookable";
import type { z } from "zod";

export interface ListOptions {
  recursive?: boolean;
}

export interface RemoveOptions {
  recursive?: boolean;
  force?: boolean;
}

export interface CopyOptions {
  recursive?: boolean;
  overwrite?: boolean;
}

export type BackendEntry = SchemasBackendEntry;

export interface BackendStat {
  type: BackendEntry["type"];
  size: number;
  mtime?: Date;
}

export interface FileSystemBackendOperations {
  read: (path: string) => Promise<string>;
  readBytes: (path: string) => Promise<Uint8Array>;
  list: (path: string, options?: ListOptions) => Promise<BackendEntry[]>;
  /**
   * Best-effort existence check.
   *
   * Backends may collapse "missing" and "could not determine existence" into
   * `false`, especially for remote transports. Use `stat()` when you need
   * error details instead of a lossy boolean.
   */
  exists: (path: string) => Promise<boolean>;
  stat: (path: string) => Promise<BackendStat>;
}

export interface FileSystemBackendMutableOperations {
  write?: (path: string, data: string | Uint8Array) => Promise<void>;
  mkdir?: (path: string) => Promise<void>;
  remove?: (path: string, options?: RemoveOptions) => Promise<void>;
  copy?: (sourcePath: string, destinationPath: string, options?: CopyOptions) => Promise<void>;
}

export type FileSystemBackendFeature = keyof FileSystemBackendMutableOperations;

export interface FileSystemBackendMeta {
  name: string;
  description?: string;
}

export interface BackendDefinition<
  TOptionsSchema extends z.ZodType = z.ZodNever,
> {
  meta: FileSystemBackendMeta;
  optionsSchema?: TOptionsSchema;
  symbol?: symbol;
  setup: (
    options: z.output<TOptionsSchema>,
  ) => FileSystemBackendOperations & FileSystemBackendMutableOperations;
}

export interface FileSystemBackend
  extends FileSystemBackendOperations, FileSystemBackendMutableOperations {
  readonly features: ReadonlySet<FileSystemBackendFeature>;
  readonly meta: FileSystemBackendMeta;
  hook: HookableCore<BackendHooks>["hook"];
}

export type BackendArgs<TOptionsSchema extends z.ZodType>
  = [z.input<TOptionsSchema>] extends [never]
    ? []
    : undefined extends z.input<TOptionsSchema>
      ? [options?: z.input<TOptionsSchema>]
      : [options: z.input<TOptionsSchema>];

export type BackendFactory<TOptionsSchema extends z.ZodType>
  = (...args: BackendArgs<TOptionsSchema>) => FileSystemBackend;

export interface BackendHooks {
  "error": (payload: {
    op: keyof (FileSystemBackendOperations & FileSystemBackendMutableOperations);
    path: string;
    error: Error;
  }) => void;
  "read:before": (payload: { path: string }) => void;
  "read:after": (payload: { path: string; content: string }) => void;
  "readBytes:before": (payload: { path: string }) => void;
  "readBytes:after": (payload: { path: string; data: Uint8Array }) => void;
  "list:before": (payload: { path: string; recursive: boolean }) => void;
  "list:after": (payload: { path: string; recursive: boolean; entries: BackendEntry[] }) => void;
  "exists:before": (payload: { path: string }) => void;
  "exists:after": (payload: { path: string; result: boolean }) => void;
  "stat:before": (payload: { path: string }) => void;
  "stat:after": (payload: { path: string; stat: BackendStat }) => void;
  "write:before": (payload: { path: string; data: string | Uint8Array }) => void;
  "write:after": (payload: { path: string }) => void;
  "mkdir:before": (payload: { path: string }) => void;
  "mkdir:after": (payload: { path: string }) => void;
  "remove:before": (payload: { path: string } & RemoveOptions) => void;
  "remove:after": (payload: { path: string } & RemoveOptions) => void;
  "copy:before": (payload: {
    sourcePath: string;
    destinationPath: string;
  } & CopyOptions) => void;
  "copy:after": (payload: {
    sourcePath: string;
    destinationPath: string;
  } & CopyOptions) => void;
}

export type HookKey = keyof BackendHooks;

export type HookPayloadMap = {
  [K in keyof BackendHooks]: Parameters<NonNullable<BackendHooks[K]>>[0];
};

export type HookPayload = NonNullable<HookPayloadMap[keyof HookPayloadMap]>;
