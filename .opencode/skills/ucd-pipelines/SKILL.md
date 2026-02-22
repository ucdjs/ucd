# UCD.js Pipelines Skill

Skill for working with the UCD.js pipelines system for data extraction and artifact generation.

## Overview

Pipelines are the internal extraction/build path in UCD.js. They define how Unicode Character Database (UCD) files are processed, parsed, transformed, and converted into artifacts (JSON data packages).

The pipelines system is split into 9 packages:

| Package | Purpose |
|---------|---------|
| `@ucdjs/pipelines-core` | Core types, definitions, filters, DAG execution |
| `@ucdjs/pipelines-executor` | Pipeline execution engine with caching |
| `@ucdjs/pipelines-loader` | Loading and resolving pipeline definitions |
| `@ucdjs/pipelines-artifacts` | Artifact storage and retrieval |
| `@ucdjs/pipelines-graph` | Execution graph visualization |
| `@ucdjs/pipelines-presets` | Pre-built parsers, resolvers, and routes |
| `@ucdjs/pipelines-ui` | React hooks and UI components |
| `@ucdjs/pipelines-server` | Development server with UI |
| `@ucdjs/pipelines-playground` | Interactive playground |

## Core Concepts

### Pipeline

A pipeline is a declarative configuration that defines:
- **Sources** - Where to read input files from
- **Routes** - How to process matched files
- **Filters** - Which files to include/exclude
- **Versions** - Which Unicode versions to process

```typescript
import { definePipeline, byExt } from '@ucdjs/pipelines-core';

const pipeline = definePipeline({
  id: 'my-pipeline',
  name: 'My Pipeline',
  description: 'Processes Unicode data files',
  versions: ['16.0.0', '15.1.0'],
  inputs: [source],        // PipelineSourceDefinition[]
  routes: [route],         // PipelineRouteDefinition[]
  include: byExt('.txt'),  // Only process .txt files
  strict: false,           // Don't error on unmatched files
  concurrency: 4,          // Max concurrent route executions
});
```

### Routes

Routes match files and define how to process them:

```typescript
import { definePipelineRoute, byName } from '@ucdjs/pipelines-core';
import { z } from 'zod';

const myRoute = definePipelineRoute({
  id: 'unicode-data',
  filter: byName('UnicodeData.txt'),
  parser: standardParser,
  resolver: propertyJsonResolver,
  depends: [],           // Dependencies on other routes
  emits: {               // Artifacts produced
    metadata: { _type: 'artifact', schema: z.object({...}), scope: 'version' }
  },
  transforms: [],        // Transform pipeline
  cache: true,           // Enable caching
});
```

**Route Properties:**
- `id` - Unique identifier
- `filter` - Predicate to match files (`PipelineFilter`)
- `parser` - Async iterable parser (`ParserFn`)
- `resolver` - Transforms parsed rows to output
- `depends` - Dependencies on routes/artifacts
- `emits` - Artifact definitions with Zod schemas
- `transforms` - Chain of transforms applied before resolver
- `cache` - Whether to cache results

### Sources

Sources provide files to pipelines via backends:

```typescript
import { createMemorySource, createHttpSource } from '@ucdjs/pipelines-core';

// Memory source (for testing)
const memorySource = createMemorySource({
  id: 'test',
  files: {
    '16.0.0': [
      { path: 'UnicodeData.txt', content: '...' }
    ]
  }
});

// HTTP source (from unicode.org)
const httpSource = createHttpSource({
  id: 'unicode-org',
  baseUrl: 'https://unicode.org/Public',
  versionFormat: (v) => v.replace(/\./g, '_'),
  includes: byExt('.txt'),
});
```

**Source Properties:**
- `id` - Unique identifier
- `backend` - SourceBackend implementation
- `includes` - Optional filter for included files
- `excludes` - Optional filter for excluded files

### Artifacts

Artifacts are typed outputs produced by routes:

```typescript
import { z } from 'zod';

const metadataSchema = z.object({
  version: z.string(),
  count: z.number(),
});

const route = definePipelineRoute({
  id: 'example',
  filter: byName('data.txt'),
  emits: {
    metadata: {
      _type: 'artifact',
      schema: metadataSchema,
      scope: 'version',  // 'version' | 'global'
    }
  },
  resolver: async (ctx, rows) => {
    // Access artifacts from dependencies
    const depArtifact = ctx.getArtifact('otherRoute:artifactName');
    
    // Emit artifact
    ctx.emitArtifact('metadata', { version: '16.0.0', count: 100 });
    
    return [...rows];
  }
});
```

**Artifact Scope:**
- `version` - One artifact per Unicode version
- `global` - Shared across all versions

### Dependencies

Routes can depend on other routes or their artifacts:

```typescript
import { createRouteDependency, createArtifactDependency } from '@ucdjs/pipelines-core';

const route = definePipelineRoute({
  id: 'dependent',
  filter: byName('Derived.txt'),
  depends: [
    'unicode-data',                              // Route dependency
    'unicode-data:metadata',                     // Artifact dependency
    createRouteDependency('other-route'),        // Explicit route dep
    createArtifactDependency('route', 'artifact') // Explicit artifact dep
  ],
  resolver: async (ctx) => {
    // Access dependency artifacts
    const data = ctx.getArtifact('unicode-data:metadata');
  }
});
```

Dependencies create a **DAG (Directed Acyclic Graph)** for execution ordering.

### DAG Execution

Pipelines use DAG-based execution:

1. Routes form a dependency graph
2. Cycles are detected at definition time
3. Routes execute in topological order
4. Independent routes can execute concurrently
5. Dependent routes wait for dependencies

```typescript
import { buildDAG, getExecutionLayers } from '@ucdjs/pipelines-core';

const result = buildDAG(routes);
if (!result.valid) {
  console.error('Cycle detected:', result.errors);
}

const layers = getExecutionLayers(result.dag!);
// layers = [['route-a'], ['route-b', 'route-c'], ['route-d']]
```

### Filters

Filters match files based on various criteria:

```typescript
import { 
  byName,      // Match file name
  byDir,       // Match directory
  byExt,       // Match extension
  byGlob,      // Match glob pattern (picomatch)
  byPath,      // Match exact path or regex
  byProp,      // Match row property
  bySource,    // Match source ID
  and,         // Combine with AND
  or,          // Combine with OR
  not,         // Negate filter
  always,      // Match all files
  never,       // Match no files
} from '@ucdjs/pipelines-core';

// Example filters
byName('UnicodeData.txt');
byExt('.txt');
byGlob('**/emoji/*.txt');
byPath(/^extracted\//);
and(byExt('.txt'), not(byName('ReadMe.txt')));
```

### Transforms

Transforms process parsed rows in a chain:

```typescript
import { definePipelineTransform, applyTransforms } from '@ucdjs/pipelines-core';

const filterEmpty = definePipelineTransform({
  id: 'filter-empty',
  fn: async function* (_ctx, rows) {
    for await (const row of rows) {
      if (row.value) yield row;
    }
  }
});

const addTimestamp = definePipelineTransform({
  id: 'add-timestamp',
  fn: async function* (ctx, rows) {
    for await (const row of rows) {
      yield { ...row, processedAt: ctx.now() };
    }
  }
});

// Usage in route
const route = definePipelineRoute({
  id: 'example',
  filter: byExt('.txt'),
  parser: standardParser,
  transforms: [filterEmpty, addTimestamp],
  resolver: async (ctx, rows) => {
    // Rows have been filtered and timestamped
    return [...rows];
  }
});
```

## Execution

### Creating an Executor

```typescript
import { createPipelineExecutor, createMemoryCacheStore } from '@ucdjs/pipelines-executor';

const executor = createPipelineExecutor({
  cacheStore: createMemoryCacheStore(),
  artifacts: [],           // Global artifacts available to all pipelines
  onEvent: (event) => {   // Event handler
    console.log(event.type, event.id);
  }
});

const results = await executor.run([pipeline], {
  version: '16.0.0',       // Specific version to run
});
```

### Events

Pipeline execution emits events:

```typescript
type PipelineEventType = 
  | 'pipeline:start'       // Pipeline execution started
  | 'pipeline:end'         // Pipeline execution completed
  | 'version:start'        // Version processing started
  | 'version:end'          // Version processing completed
  | 'artifact:start'       // Artifact processing started
  | 'artifact:end'         // Artifact processing completed
  | 'artifact:produced'    // Artifact was produced
  | 'artifact:consumed'    // Artifact was consumed
  | 'file:matched'         // File matched a route
  | 'file:skipped'         // File skipped (no route)
  | 'file:fallback'        // File handled by fallback
  | 'parse:start'          // Parsing started
  | 'parse:end'            // Parsing completed
  | 'resolve:start'        // Resolution started
  | 'resolve:end'          // Resolution completed
  | 'cache:hit'            // Cache hit
  | 'cache:miss'           // Cache miss
  | 'cache:store'          // Stored in cache
  | 'error';               // Error occurred
```

### Caching

The executor caches artifacts by hash:

```typescript
import { createMemoryCacheStore, defaultHashFn } from '@ucdjs/pipelines-executor';

const cache = createMemoryCacheStore({
  hashFn: defaultHashFn,   // Default: SHA-256 of inputs
});

// Cache key includes:
// - Route ID
// - Version
// - File hash
// - Dependency hashes
```

## Presets

The `@ucdjs/pipelines-presets` package provides pre-built components:

### Parsers

```typescript
import { 
  standardParser,           // Parses key-value pairs
  multiPropertyParser,      // Parses multi-property files
  sequenceParser,           // Parses sequence definitions
  unicodeDataParser,        // Parses UnicodeData.txt format
  createStandardParser,     // Factory for standard parser
  createMultiPropertyParser // Factory for multi-property parser
} from '@ucdjs/pipelines-presets';
```

### Resolvers

```typescript
import { 
  propertyJsonResolver,      // Resolves to PropertyJson[]
  createPropertyJsonResolver, // Factory with options
  createGroupedResolver       // Groups by property
} from '@ucdjs/pipelines-presets';
```

### Routes

```typescript
import {
  coreRoutes,              // Core UCD routes
  emojiRoutes,             // Emoji routes
  allRoutes,               // All preset routes
  unicodeDataRoute,
  blocksRoute,
  scriptsRoute,
  generalCategoryRoute,
  lineBreakRoute,
  propListRoute,
  derivedCorePropertiesRoute,
  emojiDataRoute,
} from '@ucdjs/pipelines-presets';
```

### Pipeline Factories

```typescript
import { 
  createBasicPipeline,    // Core UCD files only
  createEmojiPipeline,    // Emoji files
  createFullPipeline      // All UCD files
} from '@ucdjs/pipelines-presets';

const pipeline = createBasicPipeline({
  id: 'my-basic',
  versions: ['16.0.0'],
  concurrency: 4,
  strict: false,
});
```

## Complete Example

```typescript
import { 
  definePipeline, 
  definePipelineRoute, 
  byName,
  createHttpSource 
} from '@ucdjs/pipelines-core';
import { 
  standardParser,
  createPropertyJsonResolver,
  coreRoutes 
} from '@ucdjs/pipelines-presets';
import { createPipelineExecutor, createMemoryCacheStore } from '@ucdjs/pipelines-executor';
import { z } from 'zod';

// Define source
const source = createHttpSource({
  id: 'unicode-org',
  baseUrl: 'https://unicode.org/Public',
  versionFormat: (v) => v.replace(/\./g, '_'),
});

// Define custom route
const customRoute = definePipelineRoute({
  id: 'custom-data',
  filter: byName('MyData.txt'),
  parser: standardParser,
  emits: {
    summary: {
      _type: 'artifact',
      schema: z.object({ count: z.number() }),
      scope: 'version'
    }
  },
  resolver: async (ctx, rows) => {
    const data = [...rows];
    ctx.emitArtifact('summary', { count: data.length });
    return data;
  }
});

// Define pipeline
const pipeline = definePipeline({
  id: 'example-pipeline',
  name: 'Example Pipeline',
  versions: ['16.0.0'],
  inputs: [source],
  routes: [...coreRoutes, customRoute],
});

// Execute
const executor = createPipelineExecutor({
  cacheStore: createMemoryCacheStore(),
  onEvent: (e) => console.log(e.type)
});

const results = await executor.run([pipeline]);
console.log(results[0].summary);
```

## Testing Pipelines

```typescript
import { createMemorySource } from '@ucdjs/pipelines-core';

const testSource = createMemorySource({
  id: 'test',
  files: {
    '16.0.0': [
      { path: 'UnicodeData.txt', content: '0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;' }
    ]
  }
});

const pipeline = definePipeline({
  ...,
  inputs: [testSource]
});

// Run and assert
const result = await executor.run([pipeline]);
expect(result[0].status).toBe('success');
```

## Best Practices

1. **Use presets** - Start with `@ucdjs/pipelines-presets` before writing custom components
2. **Define schemas** - Always use Zod schemas for artifacts to ensure type safety
3. **Handle errors** - Check `result.errors` after execution
4. **Enable caching** - Use cache stores for expensive operations
5. **Test with memory sources** - Use `createMemorySource` for unit tests
6. **Monitor events** - Use `onEvent` to track execution progress
7. **Keep routes focused** - Each route should have a single responsibility
8. **Document dependencies** - Clearly document route dependencies with `depends`

## File Locations

- Core definitions: `packages/pipelines/pipeline-core/src/`
- Executor: `packages/pipelines/pipeline-executor/src/`
- Presets: `packages/pipelines/pipeline-presets/src/`
- Examples: Check `packages/pipelines/*/test/` for usage examples
