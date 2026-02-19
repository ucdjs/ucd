# Common Patterns

Common patterns and templates used across UCD.js.

## Testing

Use `mockFetch` from `#test-utils/msw` for HTTP/MSW-driven tests and rely on @ucdjs/test-utils (via `#test-utils/*`) for helpers that need to be shared across packages. Local helpers are fine for single-use cases, but should not be duplicated across packages.

```ts
import { HttpResponse, mockFetch } from "#test-utils/msw";

mockFetch([
  ["GET", "https://api.ucdjs.dev/api/v1/versions", () => {
    return HttpResponse.json(["16.0.0", "15.1.0"]);
  }],
]);
```

For API mocking, prefer the mock store helpers so tests stay consistent with the API surface.

```ts
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";

mockStoreApi({
  baseUrl: "https://api.ucdjs.dev",
  responses: {
    "/api/v1/versions": ["16.0.0", "15.1.0"],
    "/api/v1/files/{wildcard}": () => HttpResponse.text("File content"),
  },
});
```

For filesystem tests, use `testdir()` to get a temporary directory that is cleaned up automatically.

```ts
import { testdir } from "vitest-testdirs";

const storePath = await testdir();
```

Tests live in apps/api/test/routes for worker endpoints, apps/api/test/unit for unit mocks, and packages/*/test (or co-located tests) for package-level behavior.

## Pipelines

Pipelines are the internal extraction/build path that powers data production. Most consumers will use published data packages rather than running pipelines directly. Prefer updating shared presets instead of duplicating pipeline definitions. If a pipeline change impacts artifacts, update tests and snapshots for affected packages. When adding new pipeline behavior, check existing presets before introducing a new one.

## CLI Development

Run the CLI from repo root with a relative path (for example: `./packages/cli/bin/ucd.js <command>`). If the API is needed locally, run `pnpm dev:apps` first and keep it running.

## API Changes

After changing API routes or Zod schemas, run `pnpm build:openapi` in apps/api and update client expectations if schemas or response formats change.
