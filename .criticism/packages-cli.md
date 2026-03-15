# Critique: `packages/cli` (`@ucdjs/cli`)

## Validation

- `pnpm --dir packages/cli run typecheck` -> passed
- `pnpm --dir packages/cli run build` -> passed

## Findings

- The CLI has become a convergence point for too many subsystems. [packages/cli/package.json](/Users/luxass/dev/ucdjs/ucd/packages/cli/package.json) pulls in client, fs-bridge, lockfile, pipelines, schema-gen, and ucd-store. That is valid criticism because every subsystem-level design problem now lands directly in the terminal UX.
- The README in [packages/cli/README.md](/Users/luxass/dev/ucdjs/ucd/packages/cli/README.md) is almost empty for a package with a broad command surface. Users have to reverse-engineer commands from [packages/cli/src/cmd](/Users/luxass/dev/ucdjs/ucd/packages/cli/src/cmd).
- The store commands in [packages/cli/src/cmd/store/_shared.ts](/Users/luxass/dev/ucdjs/ucd/packages/cli/src/cmd/store/_shared.ts) mirror the complexity of `ucd-store` instead of insulating users from it. That means CLI ergonomics are only as good as the underlying storage design, which is currently not good enough.
- The repo has tests under [packages/cli/test](/Users/luxass/dev/ucdjs/ucd/packages/cli/test), but no package-local `test` script. That is exactly the DX inconsistency you called out.
- The CLI lacks diagrams and task maps. For something that fronts store flows, pipelines, and codegen, a command-to-subsystem diagram would reduce a lot of current ambiguity.

## What is good

- Build and typecheck are clean.
- The command surface is already broad enough to become a strong orchestrator if the underlying boundaries improve.

## Suggested next moves

1. Make the CLI the simplifier, not the place where every subsystem leak is exposed raw.
2. Add package-local test and usage docs for the main command families.
3. Add a diagram mapping commands to packages and services.
