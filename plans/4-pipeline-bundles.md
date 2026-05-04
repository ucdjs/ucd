# Pipeline Bundles

## Summary

Revisit the bundle concept only after pipeline-level orchestration is implemented and stable.

This plan exists to preserve room for bundles without letting them shape the first orchestration implementation.

The working assumption is that dependency-only root pipelines may cover most immediate bundle use cases. Bundle support should only be added if a separate grouping concept still provides clear value after orchestration ships.

## Position

Bundles are not part of the orchestration foundation.

First:

- pipelines gain pipeline-level orchestration relationships
- orchestration runs are graph-driven
- dependency-only root pipelines can express group entrypoints like `all`

Only after that should the project decide whether bundles are still necessary.

## What A Bundle Would Mean

If introduced later, a bundle should be a grouping or entrypoint concept, not a second orchestration engine.

A bundle may be useful for:

- grouping multiple pipelines in one authored file
- defining a named entrypoint for a pipeline set
- improving discovery and UI presentation
- expressing curated “run these together” flows without inventing no-op root pipelines

A bundle should not define:

- execution order rules
- parallel versus sequential strategy
- dependency semantics
- inter-pipeline data flow semantics

Those belong to pipeline-level dependencies and the executor graph.

Those rules should already be settled before bundle work starts.

## Likely Shape

If bundles remain useful after orchestration is implemented, the likely shape is:

```ts
export interface PipelineBundleDefinition {
  id: string;
  name: string;
  description?: string;
  pipelines: readonly AnyPipelineDefinition[];
  hooks?: PipelineHooks;
}
```

This remains intentionally small.

Possible authored API:

```ts
export function definePipelineBundle(options: {
  id: string;
  name: string;
  description?: string;
  pipelines: readonly AnyPipelineDefinition[];
  hooks?: PipelineHooks;
}): PipelineBundleDefinition;
```

Meaning:

- the bundle wraps pipelines
- the pipelines still own their own dependencies and outputs
- execution still resolves from the pipeline graph
- bundle hooks, if kept, should not create a second hook model

## Examples

### V1 alternative: dependency-only root pipeline

This is the preferred solution before bundles exist:

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

This works as an orchestration root, but it is still a pipeline definition.

### Later bundle example

If bundles are still needed later, the equivalent grouping could look like:

```ts
const all = definePipelineBundle({
  id: "all",
  name: "All Pipelines",
  description: "Run the main pipeline set",
  pipelines: [
    blocks,
    unicodeData,
    derivedReports,
  ],
});
```

In that model:

- the bundle groups pipelines
- the grouped pipelines still keep their own orchestration relationships
- the executor still resolves execution from the pipeline graph
- the bundle acts as a discovery or entrypoint object, not as an execution strategy object

### File-level grouping example

One potential reason to add bundles later is grouping several related pipelines in one file without inventing a no-op root pipeline:

```ts
export const bundle = definePipelineBundle({
  id: "emoji-suite",
  name: "Emoji Suite",
  pipelines: [
    emojiBase,
    emojiAnnotations,
    emojiDerived,
  ],
});
```

This may be useful for loader discovery and UI grouping, but should not change orchestration rules.

## Decision Gate

Do not implement bundle support until these questions are answered with real post-orchestration evidence:

- Are dependency-only root pipelines too awkward for authoring?
- Is there a strong file-level grouping use case that pipelines do not express cleanly?
- Does the UI need a first-class grouping object distinct from a pipeline?
- Does discovery or loading materially benefit from a bundle type?

If the answer to most of these is no, bundles should not be added.

## If Implemented Later

Bundle implementation would likely touch:

- loader discovery for `*.ucd-bundle.ts`
- loader export validation for bundle definitions
- CLI and server source listing
- UI labeling and visualization of grouped pipelines

But execution should still route through pipeline orchestration semantics already established by the earlier plans.

## Non-Goals

This plan does not authorize:

- bundle-first execution semantics
- bundle-specific dependency graphs
- redefinition of pipeline-level outputs

## Acceptance Criteria

This plan is complete when:

- the project has a documented place to revisit bundles later
- bundles are explicitly separated from orchestration semantics
- dependency-only root pipelines are recognized as the v1 alternative
