# Integration & E2E Tests for @ucdjs/fs-backend

## Goals

- Test the **node backend** against a real filesystem (no mocks)
- Test the **http backend** against a mocked HTTP server (MSW)
- Test the **defineBackend factory** end-to-end (options validation, hook firing, feature inference)
- Cover security: path traversal, boundary enforcement

## Tools

| Tool | Purpose |
|------|---------|
| `vitest` | Test runner (already in monorepo) |
| `vitest-testdirs` | Creates isolated temp directories per test, auto-cleaned |
| `msw` | HTTP mocking for the http backend |
| `@ucdjs/test-utils` | MSW setup (`mockFetch`, `HttpResponse`) — already wired in root vitest config |

## Test File Layout

```
packages/fs-backend/test/
├── define.test.ts        — factory: options validation, feature inference, hook wiring, setup errors
├── node.test.ts          — node backend: all 6 ops against real FS (vitest-testdirs)
├── http.test.ts          — http backend: read/list/exists against MSW mocks
├── guards.test.ts        — hasFeature, isHttpBackend, assertFeature
└── security.test.ts      — path traversal, encoded paths, boundary enforcement (node backend)
```

## Vitest Config

No per-package `vitest.config.ts` needed. The root `vitest.config.ts` automatically
scans `packages/fs-backend/test/` and picks up all test files.

## Test Scenarios

### define.test.ts

- `defineBackend()` returns a factory function
- Factory throws `BackendSetupError` when `setup()` throws
- Factory validates options via Zod schema (throws on invalid input)
- Optional options (undefined schema) creates backend without args
- `features` set is correctly inferred: node backend has `write/mkdir/remove`, http has none
- Hook `read:before` fires before `read()`, `read:after` fires after with content
- Hook `error` fires when an operation throws
- Symbol brand is attached to instance when `symbol` is provided

### node.test.ts (uses `vitest-testdirs`)

```ts
const dir = await testdir({ "hello.txt": "world" });
const backend = NodeBackend({ basePath: dir });
```

- `read("/hello.txt")` returns `"world"`
- `read("/missing.txt")` throws `BackendFileNotFound`
- `read("/")` throws `BackendEntryIsDirectory`
- `list("/")` returns correct `BackendEntry[]`
- `list("/", { recursive: true })` returns full tree
- `exists("/hello.txt")` → `true`, `exists("/nope.txt")` → `false`
- `write("/new.txt", "data")` creates file; subsequent `read` returns `"data"`
- `mkdir("/subdir/")` creates directory; subsequent `exists` → `true`
- `remove("/hello.txt")` deletes file; subsequent `exists` → `false`
- `remove("/subdir/", { recursive: true })` removes directory tree

### http.test.ts (uses MSW via `mockFetch`)

```ts
const backend = HttpBackend({ baseUrl: new URL("https://test.example.com") });
```

- `read("/file.txt")` — GET returns 200 text → content returned
- `read("/file.txt")` — GET returns 404 → throws `BackendFileNotFound`
- `read("/file.txt")` — GET returns 500 → throws `BackendError`
- `list("/")` — GET returns valid JSON `BackendEntry[]` → entries returned
- `list("/")` — GET returns 404/403 → returns `[]`
- `exists("/file.txt")` — HEAD returns 200 → `true`
- `exists("/missing.txt")` — HEAD returns 404 → `false`
- `features` set is empty (no write/mkdir/remove)
- `isHttpBackend(backend)` → `true`
- `isHttpBackend(NodeBackend({ basePath: "/" }))` → `false`

### guards.test.ts

- `hasFeature(nodeBackend, "write")` → `true`
- `hasFeature(httpBackend, "write")` → `false`
- `assertFeature(nodeBackend, "write")` → does not throw
- `assertFeature(httpBackend, "write")` → throws `BackendUnsupportedOperation`

### security.test.ts (node backend only)

- `read("/../etc/passwd")` → throws (path traversal blocked)
- `read("/%2e%2e/etc/passwd")` → throws (URL-encoded traversal blocked)
- `read("/valid/../../../etc")` → throws
- All operations respect `basePath` sandbox: cannot escape it regardless of input

## What "integration" means here

The node backend tests ARE integration tests — they use real `fs/promises` against a real
temp filesystem created by `vitest-testdirs`. No mocking of filesystem operations.

The http backend tests mock the HTTP layer via MSW but exercise the full request/response
cycle through the backend's fetch logic.

There is no separate "e2e" layer needed for this package — the integration coverage
is sufficient since the package has no external process boundary.
