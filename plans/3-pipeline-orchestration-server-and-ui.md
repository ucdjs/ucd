# Pipeline Orchestration Server And UI

## Summary

Apply the orchestration model to `pipeline-server`, CLI, and UI after `pipeline-core` and `pipeline-executor` semantics are stable.

This plan covers:

- orchestration-aware execution entrypoints
- persisted pipeline outputs
- execution records and terminology
- UI representation of dependency-triggered runs

Bundles remain out of scope for this phase.

## Server Behavior

### Treat selected pipelines as orchestration roots

When the user requests execution for one pipeline:

- the server treats that pipeline as the selected root
- the server resolves the pipeline set needed for orchestration
- the executor runs the resolved graph

When the user requests execution for multiple pipelines:

- the server treats them as selected roots
- shared upstream pipelines are deduped
- one orchestration run is executed

### Persist pipeline outputs

The server owns durable pipeline output persistence.

Persisted pipeline outputs should be keyed by:

- workspace id
- orchestration execution id
- pipeline id
- version
- output id

This phase should persist successful outputs only.

### Record orchestration context in execution metadata

Execution records should capture more than just the selected pipeline id.

At minimum, the persisted model should distinguish:

- selected root pipeline ids
- resolved pipeline ids that actually participated
- per-pipeline result summaries
- orchestration-level status

The server should not continue to treat every execution as if only one isolated pipeline ran.

## CLI Behavior

### Keep pipeline-first UX

The CLI should continue to let the user select pipelines.

Behavior:

- selecting one pipeline starts an orchestration rooted at that pipeline
- selecting multiple pipelines starts one orchestration with multiple roots
- output messaging should make it clear when upstream dependencies were also executed

### Execution output

CLI summaries should show:

- selected roots
- resolved pipeline count
- per-pipeline completion or failure
- orchestration-level failure when validation or dependency setup fails before execution

## UI Behavior

### Show that one pipeline selection may trigger many pipelines

The UI should clearly communicate:

- which pipeline(s) the user selected
- which upstream pipelines were included automatically
- the dependency ordering or graph relationship between them

The user should not mistake an orchestration run for an isolated single-pipeline run.

### Distinguish pipeline details from orchestration details

The UI should keep pipeline inspection and orchestration inspection separate.

Meaning:

- pipeline pages still describe the authored pipeline definition
- orchestration execution views describe the actual resolved multi-pipeline run

### Graph representation

The graph UI should expand from route-only structure to include orchestration-level relationships where appropriate.

The first UI pass does not need a fully unified route-plus-pipeline graph view, but it must expose pipeline-level dependency structure somewhere in the execution flow.

## Terminology Changes

Adopt these terms consistently:

- `pipeline`: the authored unit
- `root pipeline`: the user-selected pipeline entrypoint
- `orchestration run`: the resolved execution of one or more pipelines plus dependencies
- `pipeline output`: the declared cross-pipeline contract
- `route output`: route-level materialization output

Avoid using “single pipeline execution” for runs that resolve dependencies.

## Non-Goals

Do not implement in this phase:

- bundle discovery or bundle UI
- redefining core dependency semantics already settled in earlier plans

## Test Cases

- server execution of one selected root runs all required upstream pipelines
- server execution of multiple roots dedupes shared upstream dependencies
- successful pipeline outputs are persisted with the expected keys
- execution records distinguish roots from resolved participants
- CLI output shows orchestration scope rather than implying isolated pipeline execution
- UI shows that selected pipelines triggered additional upstream work

## Assumptions

- `pipeline-loader` has already validated the resolved pipeline set, including duplicate pipeline id rejection
- core dependency and output types are already implemented
- executor already returns orchestration-level result data
