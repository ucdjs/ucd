# @ucdjs/fs-backend

Replaces `@ucdjs/fs-bridge` as the single filesystem abstraction for the entire repo.
`@ucdjs/fs-bridge` is deprecated once all consumers are migrated.

## Package Identity

- **Package name:** `@ucdjs/fs-backend`
- **Location:** `packages/fs-backend/`
- **Scope:** Public (`@ucdjs/`)

## Operations

Five required operations, four optional backend capabilities:

```ts
interface FileSystemBackendOperations {
  read(path: string): Promise<string>;
  readBytes(path: string): Promise<Uint8Array>;
  list(path: string, options?: ListOptions): Promise<BackendEntry[]>;
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<BackendStat>;
}

interface ListOptions {
  recursive?: boolean;
}

interface FileSystemBackendMutableMethods {
  write(path: string, data: string | Uint8Array): Promise<void>;
  mkdir(path: string): Promise<void>;
  remove(path: string, options?: RemoveOptions): Promise<void>;
  copy(sourcePath: string, destinationPath: string, options?: CopyOptions): Promise<void>;
}

interface RemoveOptions {
  recursive?: boolean;
  force?: boolean;
}

interface CopyOptions {
  recursive?: boolean;
  overwrite?: boolean;
}
```

Backend instances always expose `write`, `mkdir`, `remove`, and `copy`.
Unsupported mutable operations throw `BackendUnsupportedOperation` and should be
guarded with `features.has(...)` when the current code path depends on them.

**Notes:**
- `list` not `listdir` — generic listing, not a POSIX syscall name
- `remove` not `rm` — readable English, no UNIX shorthand
- `write(path, data)` — no `encoding` param; convert before calling if needed
- `exists(path)` is intentionally lossy. Backends may return `false` both for "missing"
  and for "could not determine existence". Use `stat()` when callers need error detail.
- `copy(sourcePath, destinationPath)` is intra-backend only
- File copies treat `destinationPath` as the exact target by default, but copy into a
  directory when the destination ends with `/` or already exists as a directory

## Entry Type

```ts
type BackendEntry =
  | { type: "file"; name: string; path: string }
  | { type: "directory"; name: string; path: string; children: BackendEntry[] }
```

**Path conventions:**
- All paths start with `/`
- Directory paths end with `/`
- File paths do NOT end with `/`

## Features (runtime capability detection)

```ts
type BackendFeature = "write" | "mkdir" | "remove" | "copy";
```

Exposed as `ReadonlySet<BackendFeature>` on every backend instance:

```ts
backend.features.has("write")  // true on node backend, false on http backend
```

`Set` over `Record<K, boolean>` because `.has()` is cleaner and extensible.

## Backend Instance

```ts
interface FileSystemBackend
  extends FileSystemBackendOperations,
    FileSystemBackendMutableMethods {
  readonly features: ReadonlySet<BackendFeature>;
  readonly meta: { name: string; description?: string };
  hook: HookableCore<BackendHooks>["hook"];
}
```

## Hooks

Via `hookable`. Enables observability and instrumentation without coupling into core ops.

```ts
interface BackendHooks {
  "error": (payload: { op: string; path: string; error: Error }) => void;
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
  "copy:before": (payload: { sourcePath: string; destinationPath: string } & CopyOptions) => void;
  "copy:after": (payload: { sourcePath: string; destinationPath: string } & CopyOptions) => void;
}
```

## Factory (defineBackend)

```ts
interface BackendDefinition<TOptionsSchema extends z.ZodType = z.ZodNever> {
  meta: { name: string; description?: string };
  optionsSchema?: TOptionsSchema;
  symbol?: symbol;  // optional brand for identity checks
  setup(options: z.infer<TOptionsSchema>): FileSystemBackendOperations & FileSystemBackendMutableOperations;
}

function defineBackend<TOptionsSchema extends z.ZodType>(
  def: BackendDefinition<TOptionsSchema>
): BackendFactory<TOptionsSchema>
```

`setup()` takes options, returns operations. No injected state, no injected utilities —
use closures and direct imports. Features are inferred from which optional methods `setup()` returns.

## Errors

```
BackendError (base)
├── BackendSetupError
├── BackendUnsupportedOperation
├── BackendFileNotFound
└── BackendEntryIsDirectory
```

## Guards & Assertions

```ts
// src/guards.ts
function hasFeature(backend: FileSystemBackend, feature: BackendFeature): boolean
function isHttpBackend(backend: FileSystemBackend): boolean  // symbol check

// src/assertions.ts
function assertFeature(backend: FileSystemBackend, feature: BackendFeature): asserts ...
```

## Built-in Backends

### Node (`src/backends/node.ts`)
- Options: `{ basePath: string }`
- All mutable and read-only operations
- Paths sandboxed via `resolveSafePath` from `@ucdjs/path-utils` (imported directly)
- `list()` builds correct `BackendEntry` tree
- `copy()` requires `recursive: true` for directory sources
- File copies can target exact file paths or copy into directory-like destinations

### HTTP (`src/backends/http.ts`)
- Options: `{ baseUrl: URL }`
- Read-only: `read`, `readBytes`, `list`, `exists`, `stat`
- Identity via `kHttpBackendSymbol`
- `list()` expects JSON `BackendEntry[]` response
- `exists()` uses HEAD request with fallback
- `stat()` infers type from `X-UCD-Stat-Type` when available

## Package Structure

```
packages/fs-backend/
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── define.ts
│   ├── errors.ts
│   ├── guards.ts
│   ├── assertions.ts
│   └── backends/
│       ├── node.ts
│       └── http.ts
├── test/
│   ├── define.test.ts
│   ├── node.test.ts
│   └── http.test.ts
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tsdown.config.ts
└── turbo.json
```

## Exports

```json
{
  ".": "dist/index.mjs",
  "./backends/node": "dist/backends/node.mjs",
  "./backends/http": "dist/backends/http.mjs",
  "./errors": "dist/errors.mjs"
}
```

## Dependencies

- `hookable` — hook system
- `zod` — options validation
- `@ucdjs/path-utils` — `resolveSafePath` in node backend
- `@ucdjs-internal/shared` — debugger utility

## Migration (future work)

1. **ucd-store** — swap `FileSystemBridge` → `FileSystemBackend`; `listdir` → `list`, `rm` → `remove`, `.optionalCapabilities.write === true` → `.features.has("write")`
2. **pipeline-core** — replace read-only `SourceBackend` with read-only `FileSystemBackend`
3. **test-utils** — `createMemoryMockFS` → `createMemoryBackend`, `createReadOnlyBridge` → `createReadOnlyBackend`
4. **lockfile, cli** — update imports
5. Mark `@ucdjs/fs-bridge` deprecated in package.json + README
