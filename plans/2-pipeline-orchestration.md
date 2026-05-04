# Pipeline Orchestration

## Summary

Define the orchestration behavior and the `pipeline-core` and `pipeline-executor` changes needed to implement it.

This plan establishes:

- a pipeline remains the primary authored unit
- a requested pipeline may resolve into a multi-pipeline orchestration run
- execution order is inferred dynamically from the pipeline graph
- dependency-only root pipelines such as `all` are valid
- inter-pipeline data flow uses explicit pipeline outputs
- `pipeline-core` and `pipeline-executor` own the orchestration contract

## Runtime Behavior

### Pipeline remains the authored unit

`PipelineDefinition` remains the main user-authored object. A pipeline continues to define its own inputs, routes, route DAG, versions, and orchestration metadata.

There is no second authored execution model in this phase.

### Orchestration runs may include multiple pipelines

Running a selected pipeline does not necessarily mean running it in isolation.

Instead:

1. the selected pipeline is treated as the requested root
2. the system resolves its full upstream pipeline closure
3. the executor validates the resulting graph
4. the executor runs the full graph as one orchestration run

If pipeline `C` requires `B`, and `B` requires `A`, then running `C` runs `A -> B -> C`.

### Execution is graph-driven

Execution strategy is always inferred from the orchestration graph.

Rules:

- pipeline-to-pipeline relationships define the inter-pipeline DAG
- the resolved pipeline set is assumed to already have unique pipeline ids
- missing upstream pipelines fail validation
- missing required upstream outputs fail validation
- dependency cycles fail validation
- independent pipelines in the same DAG layer may run in parallel
- dependency layers run sequentially

There is no user-configured sequential or parallel mode.

### Dependency-only root pipelines are valid

A pipeline may exist only as an orchestration root.

This means a pipeline with:

- `inputs: []`
- `routes: []`
- orchestration-only upstream relationships

is a valid grouping mechanism.

Example:

- `all` requires `basic`, `emoji`, and `full`
- selecting `all` executes the full dependency graph

This is the first answer to “run these pipelines together”.

### Failure behavior is strict

Rules:

- an upstream pipeline must succeed before dependent pipelines may start
- failed dependency validation aborts the orchestration run before execution
- downstream pipelines do not run with missing or invalid upstream state
- independent pipelines that are already runnable may still complete

### Version propagation is simple

Rules:

- a run uses one resolved version set
- downstream pipelines use the same versions as the orchestration run
- if the root is started with explicit versions, that version set propagates through the graph

Per-edge version remapping is out of scope.

### Inter-pipeline data flow uses explicit pipeline outputs

Cross-pipeline data flow must not use arbitrary `PipelineExecutionResult.data`.

Rules:

- route outputs remain route-level concerns
- pipeline outputs define the orchestration contract between pipelines
- downstream pipelines must declare which upstream pipeline outputs they require
- same-run outputs may be passed in-memory by the executor
- durable persistence belongs to the server, not the executor

### Multiple selected roots merge into one run

If multiple pipelines are selected together:

- each selected pipeline is treated as a requested root
- upstream closures are unioned
- shared upstream pipelines are deduped
- the system runs one validated orchestration graph

## `pipeline-core` Changes

### Add pipeline-level dependency metadata

Extend `PipelineDefinition` with pipeline-level dependencies that are separate from route-level `depends`.

The dependency model should support:

- upstream pipeline id
- required upstream output ids
- a branded authoring helper so dependencies are not expressed as ad hoc plain objects
- TypeScript inference of output ids from the upstream pipeline passed to the helper

Minimum direction:

```ts
export declare const PIPELINE_DEPENDENCY: unique symbol;

export interface PipelineDependencyDefinition {
  readonly [PIPELINE_DEPENDENCY]: true;
  pipelineId: string;
  outputs: readonly string[];
}
```

`PipelineDefinition` should then support:

```ts
depends?: readonly PipelineDependencyDefinition[];
```

Preferred authoring API:

```ts
export function depend<TPipeline extends AnyPipelineDefinition>(
  pipeline: TPipeline,
  options?: {
    outputs?: readonly InferPipelineOutputIds<TPipeline>[];
  },
): PipelineDependencyDefinition;
```

`depend()` should normalize the authored reference into a branded dependency record.

Minimum direction:

```ts
export function depend(
  pipeline: AnyPipelineDefinition,
  options?: {
    outputs?: readonly string[];
  },
): PipelineDependencyDefinition {
  return {
    [PIPELINE_DEPENDENCY]: true,
    pipelineId: pipeline.id,
    outputs: options?.outputs ?? [],
  };
}
```

The branded record is the stored dependency shape. The pipeline object itself is only an authoring input to `depend()`.

### Add pipeline-level output metadata

Extend `PipelineDefinition` with explicit orchestration outputs.

Minimum direction:

```ts
export interface PipelineOutputDefinition {
  id: string;
  description?: string;
}
```

`PipelineDefinition` should support:

```ts
outputs?: readonly PipelineOutputDefinition[];
```

This is the declared contract a downstream pipeline may depend on.

### Keep dependency-only root pipelines valid

`definePipeline()` must continue to allow pipelines with:

- `inputs: []`
- `routes: []`

This is required so orchestration roots like `all` can exist without pretending to process files.

### Examples

Simple one-upstream dependency:

```ts
const blocks = definePipeline({
  id: "blocks",
  name: "Blocks",
  versions: ["16.0.0"],
  inputs: [blocksSource],
  routes: [blocksRoute],
  outputs: [
    { id: "blocks-json", description: "Normalized blocks data" },
  ],
});

const searchIndex = definePipeline({
  id: "search-index",
  name: "Search Index",
  versions: ["16.0.0"],
  inputs: [],
  routes: [searchIndexRoute],
  depends: [
    depend(blocks, {
      outputs: ["blocks-json"],
    }),
  ],
});
```

Multiple upstream outputs from the same pipeline:

```ts
const unicodeData = definePipeline({
  id: "unicode-data",
  name: "Unicode Data",
  versions: ["16.0.0"],
  inputs: [unicodeDataSource],
  routes: [unicodeDataRoute],
  outputs: [
    { id: "code-points" },
    { id: "property-map" },
  ],
});

const derivedReports = definePipeline({
  id: "derived-reports",
  name: "Derived Reports",
  versions: ["16.0.0"],
  inputs: [],
  routes: [derivedReportsRoute],
  depends: [
    depend(unicodeData, {
      outputs: ["code-points", "property-map"],
    }),
  ],
});
```

Dependency-only orchestration root:

```ts
const all = definePipeline({
  id: "all",
  name: "All Pipelines",
  versions: ["16.0.0"],
  inputs: [],
  routes: [],
  depends: [
    depend(blocks, { outputs: ["blocks-json"] }),
    depend(unicodeData, { outputs: ["code-points"] }),
    depend(derivedReports),
  ],
});
```

## `pipeline-executor` Changes

### Build and validate the inter-pipeline DAG

The executor should validate pipeline-level dependencies across the selected pipeline set.

Validation rules:

- each dependency must reference an existing selected-or-resolved upstream pipeline
- each required output id must exist in the referenced upstream pipeline’s declared outputs
- cycles in the inter-pipeline graph fail validation

The existing route-level DAG logic remains separate and unchanged.

The executor should treat duplicate-id handling as a loader-owned invariant. It may keep a defensive assertion for uniqueness, but duplicate-id detection is not the primary responsibility of this plan.

### Resolve orchestration roots into a runnable graph

Executor entrypoints should support this behavior:

- given one or more selected root pipelines, resolve their transitive upstream closure
- dedupe pipelines by pipeline id
- build a topological pipeline DAG
- execute dependency layers sequentially
- execute pipelines in the same layer concurrently

### Preserve strict failure semantics

Execution behavior:

- upstream failure blocks all dependent pipelines
- independent pipelines in unrelated branches may still complete
- orchestration validation failures abort before execution begins

### Same-run pipeline output flow

The executor should expose successful same-run pipeline outputs to downstream pipelines in-memory.

The executor owns:

- produced outputs for the current orchestration run
- lookup by upstream pipeline id and output id
- passing resolved upstream outputs into downstream execution context

Downstream pipelines must not read arbitrary upstream `PipelineExecutionResult.data`.

### Orchestration result shape

Keep per-pipeline results, but introduce orchestration-level structure around them.

Minimum required shape:

- orchestration run status
- selected root pipeline ids
- resolved pipeline ids
- per-pipeline execution results
- orchestration-level validation or dependency errors

The implementer should add a dedicated orchestration result type rather than overloading a plain `PipelineExecutionResult[]`.

### Test Cases

- pipeline definitions can declare pipeline-level `depends`
- pipeline definitions can declare dependencies via `depend(upstream, { outputs })`
- `depend(upstream)` defaults to `outputs: []`
- invalid inferred output ids fail at type-check time in authored code
- pipeline definitions can declare pipeline-level `outputs`
- dependency-only root pipelines are valid definitions
- missing upstream pipeline reference fails validation
- missing upstream output reference fails validation
- cycle detection fails validation
- transitive dependency closure is resolved correctly
- same-layer pipelines execute concurrently
- downstream pipelines are skipped after upstream failure
- successful same-run outputs are available to downstream pipelines
- existing standalone pipelines still execute unchanged when no pipeline-level dependencies exist

## Assumptions

- `pipeline-loader` has already rejected duplicate pipeline ids in the resolved pipeline set
- output ids are unique within a single pipeline definition
- existing single-pipeline behavior remains supported for pipelines with no upstream pipeline relationships
- route-level DAG behavior remains unchanged
- bundle support may be added later, but only on top of this orchestration model
