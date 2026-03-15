# Critique: `tooling/tsconfig` (`@ucdjs-tooling/tsconfig`)

## Validation

- package-local `typecheck` script -> none
- package-local `build` script -> none
- package-local `test` script -> none

## Findings

- This package is one of the most powerful pieces of shared tooling, but it has no real validation beyond linting. For central config, that is weak.
- The config layer is also part of the boundary problem. The path aliases in [tooling/tsconfig/base.json](/Users/luxass/dev/ucdjs/ucd/tooling/tsconfig/base.json) make cross-package source access easy, which helps development but also hides packaging reality and contributes to the repo’s “reference source without being strict” problem.
- The README in [tooling/tsconfig/README.md](/Users/luxass/dev/ucdjs/ucd/tooling/tsconfig/README.md) shows how to extend configs, but not the tradeoffs or the repo-specific conventions these configs enforce.
- A package relationship diagram for source aliases versus published package boundaries would be extremely useful here.

## What is good

- Centralizing TS config is the right move.
- The package is already recognized as shared infra instead of ad hoc local config.

## Suggested next moves

1. Validate the configs with fixture projects or contract tests.
2. Revisit aliases that undermine package strictness.
3. Add docs and diagrams explaining how these configs interact with workspace boundaries.
