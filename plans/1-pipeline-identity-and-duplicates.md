# Pipeline Identity And Duplicate IDs

## Summary

Implement duplicate pipeline id handling before introducing orchestration dependencies.

This plan exists because the current system already becomes unsafe when two loaded pipelines share the same id.

The first step is to define and implement:

- what uniquely identifies a pipeline in an orchestration run
- whether duplicate pipeline ids are allowed
- how duplicate ids fail

## Decision

V1 should treat duplicate pipeline ids as invalid and fail early.

Rules:

- `pipeline.id` is the runtime identity used for orchestration in v1
- pipeline ids must be unique within the fully resolved pipeline set for one orchestration run
- duplicate ids are a validation error
- primary validation should happen during pipeline loading and resolution, before execution begins

The error should include enough context to find the conflict, ideally:

- pipeline id
- source file path or source label
- export name when available

## Implementation Direction

The first implementation should do one thing only:

- detect duplicate pipeline ids in the fully resolved pipeline set
- return or surface a structured loader validation error before orchestration logic begins

Primary enforcement point:

- `pipeline-loader` owns duplicate-id validation for the resolved pipeline set

Secondary invariant:

- `pipeline-executor` may keep a defensive uniqueness assertion, but it is not the primary feature owner

## Why This Is The Right First Step

Without a duplicate-id rule:

- executor maps can silently overwrite one definition with another
- server and CLI selection become inconsistent

This is already a problem in the current model and becomes a hard blocker once orchestration dependencies are introduced.

## Acceptance Criteria

- the project documents that duplicate pipeline ids fail in v1
- the rule applies to the fully resolved orchestration set, not just one file
- duplicate detection happens in `pipeline-loader` before orchestration graph construction
- duplicate errors include source context from the loaded pipeline set
- later plans may assume unique pipeline ids within the resolved run set
