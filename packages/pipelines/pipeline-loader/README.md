# @ucdjs/pipelines-loader

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

> [!IMPORTANT]
> This is an internal package. It may change without warning and is not subject to semantic versioning. Use at your own risk.

Discovers, bundles, and loads pipeline definition files for the UCD pipeline system.

## What It Does

`@ucdjs/pipelines-loader` takes a local path or remote repository reference and turns it into
loaded `PipelineDefinition` objects that `@ucdjs/pipelines-executor` can run.

It is responsible for:

- parsing locator strings (local paths, `github://`, `gitlab://`)
- materializing remote sources by downloading and caching repository archives
- discovering `.ucd-pipeline.ts` files via glob patterns
- bundling TypeScript pipeline files into ESM using Rolldown
- importing the bundled code via `data:` URLs and extracting pipeline definitions

It does not execute pipelines. Execution is handled by `@ucdjs/pipelines-executor`.

## Locator Format

Pipeline sources are identified by locator strings:

```text
# Local - file or directory path
/path/to/directory
./relative/path/to/file.ucd-pipeline.ts

# GitHub
github://owner/repo
github://owner/repo?ref=main
github://owner/repo?ref=v1.0.0&path=src/pipelines

# GitLab
gitlab://owner/repo?ref=main
```

## Loading Pipelines

### From a local path

```ts
import {
  discoverPipelineFiles,
  loadPipelinesFromPaths,
  materializePipelineLocator,
  parsePipelineLocator,
} from "@ucdjs/pipelines-loader";

const locator = parsePipelineLocator("./my-pipelines");
const { repositoryPath, issues } = await materializePipelineLocator(locator);

const { files } = await discoverPipelineFiles({ repositoryPath });
const result = await loadPipelinesFromPaths(files.map((f) => f.filePath));

// result.pipelines — loaded PipelineDefinition[]
// result.issues   — any files that failed to load
```

### From a remote source

```ts
import {
  discoverPipelineFiles,
  ensureRemoteLocator,
  loadPipelinesFromPaths,
  materializePipelineLocator,
  parsePipelineLocator,
} from "@ucdjs/pipelines-loader";

const locator = parsePipelineLocator("github://owner/repo?ref=main");

// Download and cache the repository
if (locator.kind === "remote") {
  await ensureRemoteLocator(locator);
}

const { repositoryPath } = await materializePipelineLocator(locator);
const { files } = await discoverPipelineFiles({ repositoryPath });
const result = await loadPipelinesFromPaths(files.map((f) => f.filePath));
```

## Bundling Model

Each `.ucd-pipeline.ts` file is bundled independently with Rolldown into a self-contained ESM
chunk. The bundled code is base64-encoded into a `data:` URL and imported via dynamic `import()`.

This avoids writing temporary files to disk and ensures each pipeline file is loaded in isolation.
The tradeoff is that debugging bundled pipeline code requires tracing back through the data URL
import — stack traces will reference the generated bundle rather than the original source.

## Caching

Remote sources are cached under `~/.config/ucd/cache/repos/<provider>/<owner>/<repo>/<ref>/`.
A `.ucd-cache.json` marker tracks the commit SHA and sync timestamp. Subsequent loads skip the
download when the cached SHA matches the remote.

```ts
import { checkRemoteLocatorUpdates, clearRemoteSourceCache, listCachedSources } from "@ucdjs/pipelines-loader";

// List all cached repositories
const cached = await listCachedSources();

// Check if a remote source has new commits
const update = await checkRemoteLocatorUpdates({ provider: "github", owner: "org", repo: "repo", ref: "main" });

// Clear a specific cached source
await clearRemoteSourceCache({ provider: "github", owner: "org", repo: "repo", ref: "main" });
```

## Error Handling

The loader uses `Promise.allSettled` internally so a single failing file does not prevent others
from loading. Consumers should always check `result.issues` alongside `result.pipelines`.

Structured `PipelineLoaderIssue` objects carry a typed `code` and `scope`:

- `CACHE_MISS` — remote source not yet synced
- `BUNDLE_RESOLVE_FAILED` — an import could not be resolved during bundling
- `BUNDLE_TRANSFORM_FAILED` — a parse or syntax error in the source file
- `IMPORT_FAILED` — dynamic import of the bundled module failed

## Exports

The package provides two entry points:

- `.` — main entry with loading, locator, cache, and error utilities
- `./discover` — standalone discovery (glob-based file finding)

## Installation

```bash
npm install @ucdjs/pipelines-loader
```

## License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/pipelines-loader?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/pipelines-loader
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/pipelines-loader?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/pipelines-loader
