# Critique: `tooling/eslint-plugin` (`@ucdjs-tooling/eslint-plugin`)

## Validation

- `pnpm --dir tooling/eslint-plugin run typecheck` -> passed
- package-local `build` script -> none
- package-local `test` script -> none

## Findings

- The package only ships one rule, but still carries a dedicated package boundary. That can be fine, but [tooling/eslint-plugin/README.md](/Users/luxass/dev/ucdjs/ucd/tooling/eslint-plugin/README.md) does not explain the long-term scope.
- The plugin metadata in [tooling/eslint-plugin/src/plugin.js](/Users/luxass/dev/ucdjs/ucd/tooling/eslint-plugin/src/plugin.js) hardcodes `version: "1.0.0"` instead of sourcing it from package metadata. That is a small but valid sign of tooling drift.
- There are no tests. For a lint rule package, that means no fixture-based proof that the rule behaves as intended.
- A tiny rule-boundary diagram or even a short “what belongs here” note would make the package easier to evolve.

## What is good

- Typecheck passes.
- The package at least centralizes repo-specific linting instead of scattering custom rules.

## Suggested next moves

1. Add fixture-based tests for the existing rule.
2. Stop hardcoding plugin version metadata.
3. Document the intended scope of repo-specific lint rules.
