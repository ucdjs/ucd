# @ucdjs/pipelines

Pipeline framework for processing Unicode Character Database files.

## Pipeline Flow

```
definePipeline({ versions, source, artifacts?, cacheStore?, routes })
                                      |
                                      v
                      +---------------------------+
                      |     FOR EACH VERSION      |
                      |    (16.0.0, 15.1.0...)    |
                      +---------------------------+
                                      |
      +-------------------------------+-------------------------------+
      v                               v                               v
+-----------+                 +---------------+                +-----------+
|  SOURCE   |---- files ----->|   ARTIFACTS   |--- context --->|  ROUTES   |
+-----------+                 |  (optional)   |                +-----------+
                              +---------------+                      |
                      +----------------------------------------------+
                      v
          +---------------------+
          |   FOR EACH FILE     |
          +---------------------+
                      |
                      v
          +---------------------+
          |   ROUTE MATCHING    |
          |                     |
          | byName, byDir,      |
          | byGlob, and, or...  |
          +---------------------+
                      |
        +-------------+-------------+
        v             v             v
   +---------+   +---------+   +----------+
   | MATCHED |   | SKIPPED |   | FALLBACK |
   +---------+   +---------+   +----------+
        |                            |
        +------------+---------------+
                     v
          +---------------------+
          |    CACHE CHECK      |
          |                     |
          | key = route+version |
          |     + content hash  |
          |     + artifact hash |
          +---------------------+
                     |
          +----------+----------+
          v                     v
   +-------------+       +-------------+
   |  CACHE HIT  |       | CACHE MISS  |
   |             |       |             |
   |   return    |       |   execute   |
   |   cached    |       |   route     |
   +-------------+       +-------------+
          |                     |
          |                     v
          |          +---------------------+
          |          |       PARSER        |
          |          |                     |
          |          | file -> ParsedRow[] |
          |          +---------------------+
          |                     |
          |                     v
          |          +---------------------+
          |          |      RESOLVER       |
          |          |                     |
          |          | getArtifact(id)     |
          |          | emitArtifact(id,v)  |
          |          | return outputs      |
          |          +---------------------+
          |                     |
          |                     v
          |          +---------------------+
          |          |    CACHE STORE      |
          |          +---------------------+
          |                     |
          +----------+----------+
                     v
          +---------------------+
          |   MERGE ARTIFACTS   |
          |                     |
          | emitted artifacts   |
          | available to next   |
          | routes              |
          +---------------------+
                     |
                     v
          +---------------------+
          |       RESULT        |
          |                     |
          | { data, graph,      |
          |   errors, summary } |
          +---------------------+
```
definePipeline({ versions, source, artifacts?, cacheStore?, routes })
                                    │
                                    ▼
                        ┌────────────────────────┐
                        │   FOR EACH VERSION   │
                        │  (16.0.0, 15.1.0...) │
                        └────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
   ┌─────────┐              ┌───────────────┐            ┌─────────────┐
   │ SOURCE  │─────────────▶│  ARTIFACTS   │────────────▶│   ROUTES   │
   │         │  files      │  (optional)  │  context   │            │
   └─────────┘              └───────────────┘            └─────────────┘
                                                            │
                                    ┌──────────────────────────┘
                                    ▼
                        ┌───────────────────────┐
                        │    FOR EACH FILE    │
                        └───────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │    ROUTE MATCHING   │
                        │                     │
                        │  byName, byDir,     │
                        │  byGlob, and, or... │
                        └───────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                ▼                   ▼                   ▼
           ┌─────────┐        ┌─────────┐        ┌──────────┐
           │ MATCHED │        │ SKIPPED │        │ FALLBACK │
           └─────────┘        └─────────┘        └──────────┘
                │                                      │
                └──────────────────┬───────────────────┘
                                   ▼
                        ┌───────────────────────┐
                        │    CACHE CHECK        │
                        │                       │
                        │  key = route + version│
                        │      + content hash   │
                        │      + artifact hash  │
                        └───────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
              ┌───────────┐                ┌─────────────┐
              │ CACHE HIT │                │ CACHE MISS  │
              │           │                │             │
              │  return   │                │   execute   │
              │  cached   │                │   route     │
              └───────────┘                └─────────────┘
                    │                             │
                    │                             ▼
                    │                  ┌───────────────────────┐
                    │                  │       PARSER          │
                    │                  │                       │
                    │                  │  file ──▶ ParsedRow[] │
                    │                  └───────────────────────┘
                    │                             │
                    │                             ▼
                    │                  ┌───────────────────────┐
                    │                  │      RESOLVER         │
                    │                  │                       │
                    │                  │  - getArtifact(id)    │
                    │                  │  - emitArtifact(id,v) │
                    │                  │  - return outputs     │
                    │                  └───────────────────────┘
                    │                             │
                    │                             ▼
                    │                  ┌───────────────────────┐
                    │                  │     CACHE STORE       │
                    │                  └───────────────────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                        ┌───────────────────────┐
                        │   MERGE ARTIFACTS     │
                        │                       │
                        │  emitted artifacts    │
                        │  available to next    │
                        │  routes               │
                        └───────────────────────┘
                                   │
                                   ▼
                        ┌───────────────────────┐
                        │       RESULT          │
                        │                       │
                        │  { data, graph,       │
                        │    errors, summary }  │
                        └───────────────────────┘
```

## Concepts

### Source

A **Source** is the data provider that tells the pipeline where to get files from. It implements two methods:

- `listFiles(version)` - Returns all available files for a Unicode version
- `readFile(file)` - Returns the content of a specific file

Sources abstract away the storage backend, allowing the same pipeline to work with local files, remote HTTP servers, or in-memory test fixtures.

### Artifacts

**Artifacts** are computed values that can be shared across routes. They enable:

- **Shared lookup tables** - e.g., a Map of codepoint -> character name that multiple routes need
- **Route dependencies** - One route produces data that another route consumes
- **Cross-file data** - Combine data from multiple files into a single structure

There are two ways to create artifacts:

#### Pre-defined Artifacts

Use `definePipelineArtifact()` for artifacts that should be built **before** any routes execute. These are ideal for lookup tables that many routes need.

```ts
import { definePipelineArtifact, definePipeline, byName } from "@ucdjs/pipelines";

// Define an artifact that builds a character names lookup table
const namesArtifact = definePipelineArtifact({
  id: "names",
  // Optional: filter to find the source file
  filter: byName("UnicodeData.txt"),
  // Optional: parser to read the file
  parser: async function* (ctx) {
    for await (const line of ctx.readLines()) {
      if (ctx.isComment(line)) continue;
      const [codePoint, name] = line.split(";");
      yield { sourceFile: ctx.file.path, kind: "point", codePoint, value: name };
    }
  },
  // Build function receives version context and optional parsed rows
  build: async (ctx, rows) => {
    const names = new Map<string, string>();
    if (rows) {
      for await (const row of rows) {
        if (row.codePoint && row.value) {
          names.set(row.codePoint, String(row.value));
        }
      }
    }
    return names;
  },
});

// Use in pipeline
const pipeline = definePipeline({
  versions: ["16.0.0"],
  source: mySource,
  artifacts: [namesArtifact], // Built before routes
  routes: [myRoute],
});
```

Routes access pre-defined artifacts via `ctx.getArtifact(id)`:

```ts
const myRoute = definePipelineRoute({
  id: "my-route",
  filter: byName("SomeFile.txt"),
  parser: async function* (ctx) { /* ... */ },
  resolver: async (ctx, rows) => {
    // Access the pre-defined artifact
    const names = ctx.getArtifact("names") as Map<string, string>;
    // Use names...
    return [/* outputs */];
  },
});
```

#### Route-Emitted Artifacts

Routes can also produce artifacts for **subsequent** routes using `ctx.emitArtifact()`. This is useful when the artifact depends on route-specific processing.

```ts
// Route that PRODUCES an artifact
const namesRoute = definePipelineRoute({
  id: "unicode-data-names",
  filter: byName("UnicodeData.txt"),
  parser: async function* (ctx) { /* ... */ },
  resolver: async (ctx, rows) => {
    const names = new Map<string, string>();
    for await (const row of rows) {
      if (row.codePoint && row.value) {
        names.set(row.codePoint, String(row.value));
      }
    }

    // Emit artifact for subsequent routes
    ctx.emitArtifact("names", names);

    return []; // No output required
  },
});

// Route that CONSUMES the artifact
const lineBreakRoute = definePipelineRoute({
  id: "line-break",
  filter: byName("LineBreak.txt"),
  parser: async function* (ctx) { /* ... */ },
  resolver: async (ctx, rows) => {
    // Get artifact (throws if not found)
    const names = ctx.getArtifact("names") as Map<string, string>;

    // Use names to enrich output...
    return [{ version: ctx.version, property: "Line_Break", entries }];
  },
});

// Order matters! Producer must come before consumer
const pipeline = definePipeline({
  versions: ["16.0.0"],
  source: mySource,
  routes: [namesRoute, lineBreakRoute], // namesRoute first!
});
```

#### When to Use Which

| Use Case | Approach |
|----------|----------|
| Lookup table needed by many routes | Pre-defined artifact |
| Artifact doesn't depend on route logic | Pre-defined artifact |
| Artifact is derived from route processing | Route-emitted artifact |
| Only one or two routes need it | Route-emitted artifact |

**Important**: `ctx.getArtifact(id)` throws if the artifact doesn't exist. Make sure:
- Pre-defined artifacts are listed in the `artifacts` array
- Route-emitted artifacts come from routes that run **before** the consuming route

### Route

A **Route** defines how to process a specific type of file. Each route has:

- **id** - Unique identifier for the route
- **filter** - Predicate that matches files this route handles
- **parser** - Async generator that yields parsed rows from file content
- **resolver** - Function that transforms parsed rows into output format
- **cache** - Optional boolean to enable/disable caching for this route (default: `true`)

### Filter

**Filters** are predicate functions that determine which files a route handles:

```ts
byName("LineBreak.txt")           // Exact filename match
byDir("auxiliary")                // Files in specific directory
byExt(".txt")                     // Files with extension
byGlob("**/*Test*.txt")           // Glob pattern matching
byPath("ucd/LineBreak.txt")       // Exact path match
byProp("Line_Break")              // Match by property in row context

// Combinators
and(byExt(".txt"), byDir("ucd"))  // All conditions must match
or(byName("A.txt"), byName("B.txt")) // Any condition matches
not(byGlob("**/Test*"))           // Negate a filter
always()                          // Always matches
never()                           // Never matches
```

### Caching

The pipeline supports caching route outputs to avoid reprocessing unchanged files. Cache entries are keyed by:

- Route ID
- Unicode version
- Input file content hash
- Hashes of consumed artifacts

```ts
import { createMemoryCacheStore } from "@ucdjs/pipelines";

const cacheStore = createMemoryCacheStore();

const pipeline = definePipeline({
  versions: ["16.0.0"],
  source,
  cacheStore, // Enable caching
  routes: [namesRoute, lineBreakRoute],
});

// First run: cache miss, routes execute
await pipeline.run();

// Second run: cache hit, results returned from cache
await pipeline.run();

// Force recompute (ignore cache)
await pipeline.run({ cache: false });
```

You can disable caching per-route:

```ts
const volatileRoute = definePipelineRoute({
  id: "volatile",
  cache: false, // Never cache this route
  // ...
});
```

**Note**: Pre-defined artifacts are **not cached** - they are rebuilt for each pipeline run. Only route outputs and route-emitted artifacts are cached.

## Usage

```ts
import {
  definePipeline,
  definePipelineRoute,
  definePipelineArtifact,
  createMemoryCacheStore,
  byName,
} from "@ucdjs/pipelines";

// Pre-defined artifact for character names (built before routes)
const namesArtifact = definePipelineArtifact({
  id: "names",
  filter: byName("UnicodeData.txt"),
  parser: async function* (ctx) {
    for await (const line of ctx.readLines()) {
      if (ctx.isComment(line)) continue;
      const parts = line.split(";");
      yield { sourceFile: ctx.file.path, kind: "point", codePoint: parts[0], value: parts[1] };
    }
  },
  build: async (_ctx, rows) => {
    const names = new Map<string, string>();
    if (rows) {
      for await (const row of rows) {
        if (row.codePoint && row.value) {
          names.set(row.codePoint, String(row.value));
        }
      }
    }
    return names;
  },
});

// Route that uses the pre-defined artifact
const lineBreakRoute = definePipelineRoute({
  id: "line-break",
  filter: byName("LineBreak.txt"),
  parser: async function* (ctx) {
    for await (const line of ctx.readLines()) {
      if (ctx.isComment(line)) continue;
      const [range, property] = line.split(";").map((s) => s.trim());
      yield { sourceFile: ctx.file.path, kind: "range", start: range.split("..")[0], end: range.split("..")[1], value: property };
    }
  },
  resolver: async (ctx, rows) => {
    const names = ctx.getArtifact("names") as Map<string, string>;
    const entries = [];
    for await (const row of rows) {
      entries.push({ range: `${row.start}..${row.end}`, value: row.value });
    }
    return [{
      version: ctx.version,
      property: "Line_Break",
      file: ctx.file.name,
      entries: ctx.normalizeEntries(entries),
    }];
  },
});

// Create and run pipeline
const pipeline = definePipeline({
  versions: ["16.0.0", "15.1.0"],
  source: mySource,
  artifacts: [namesArtifact], // Pre-defined artifacts
  cacheStore: createMemoryCacheStore(),
  routes: [lineBreakRoute],
  onEvent: (event) => console.log(event.type),
});

const result = await pipeline.run();

console.log(result.summary);
// { versions: [...], totalFiles: 100, matchedFiles: 2, ... }

console.log(result.data);
// [{ version: "16.0.0", property: "Line_Break", ... }, ...]
```

## Events

The pipeline emits events during execution:

| Event | Description |
|-------|-------------|
| `pipeline:start` | Pipeline execution started |
| `pipeline:end` | Pipeline execution completed |
| `version:start` | Started processing a version |
| `version:end` | Finished processing a version |
| `artifact:start` | Started building a pre-defined artifact |
| `artifact:end` | Finished building a pre-defined artifact |
| `artifact:produced` | Route emitted an artifact |
| `artifact:consumed` | Route consumed an artifact |
| `file:matched` | File matched a route |
| `file:skipped` | File skipped (no matching route) |
| `file:fallback` | File handled by fallback |
| `parse:start` | Started parsing a file |
| `parse:end` | Finished parsing a file |
| `resolve:start` | Started resolving a file |
| `resolve:end` | Finished resolving a file |
| `cache:hit` | Route result loaded from cache |
| `cache:miss` | Route result not in cache |
| `cache:store` | Route result stored in cache |
| `error` | An error occurred |

## License

MIT
