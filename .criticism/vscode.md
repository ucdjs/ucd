# Critique: `vscode` (`vscode-ucd`)

## Validation

- `pnpm --dir vscode run typecheck` -> passed
- `pnpm --dir vscode run build` -> passed
- package-local `test` script -> none

## Findings

- The extension is leaning on unfinished storage and parsing pieces. [vscode/src/lib/ucd-parser.ts](/Users/luxass/dev/ucdjs/ucd/vscode/src/lib/ucd-parser.ts) still says “TODO: Implement real parsing”, and [vscode/src/composables/useUCDStore.ts](/Users/luxass/dev/ucdjs/ucd/vscode/src/composables/useUCDStore.ts) reaches into the same `ucd-store` stack you already called messy.
- There is a valid security concern called out in source: [vscode/src/commands/open-on-unicode.ts](/Users/luxass/dev/ucdjs/ucd/vscode/src/commands/open-on-unicode.ts) notes that upward traversal should be blocked. A TODO like that inside an extension command is not ideal.
- The README in [vscode/README.md](/Users/luxass/dev/ucdjs/ucd/vscode/README.md) is generated-command inventory, not operational documentation. It does not explain local store mode, remote store mode, or how the extension relates to the API and Store services.
- There are no tests. For an editor integration package with commands, views, and URI handling, that is thin safety coverage.
- The extension would benefit from diagrams too: VS Code command -> client/store access -> API/Store/web links.

## What is good

- Build and typecheck are clean.
- The extension is already integrated enough to expose real product seams, which makes it a useful consumer of the rest of the repo.

## Suggested next moves

1. Remove the unresolved path traversal TODO from command code by actually fixing it.
2. Stop depending on unfinished parser/store behavior without documenting the limits.
3. Add at least smoke tests and a data-flow diagram for extension behavior.
