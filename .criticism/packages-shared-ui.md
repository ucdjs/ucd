# Critique: `packages/shared-ui` (`@ucdjs-internal/shared-ui`)

## Validation

- `pnpm --dir packages/shared-ui run typecheck` -> passed
- `pnpm --dir packages/shared-ui run build` -> passed
- package-local `test` script -> none

## Findings

- The published-internal contract is intentional here, so that is not the criticism. The real issue is that [packages/shared-ui/README.md](/Users/luxass/dev/ucdjs/ucd/packages/shared-ui/README.md) barely documents a package with a very large export surface in [packages/shared-ui/package.json](/Users/luxass/dev/ucdjs/ucd/packages/shared-ui/package.json).
- There are zero tests. For a UI package exporting many primitives and components, that means no usage examples, no regression safety, and no contract documentation outside source.
- The package is functioning as a design system without design-system documentation. Consumers can import components, hooks, utilities, and styles, but there is no usage guide, no component catalog, and no explanation of visual or accessibility conventions.
- A component relationship diagram or even a simple component inventory would help a lot here, especially because this package is consumed by user-facing apps.

## What is good

- Build and typecheck are clean.
- The package is at least collected into one boundary instead of being scattered across apps.

## Suggested next moves

1. Add minimal documentation for exported components and styling entrypoints.
2. Add tests or visual verification around the highest-value primitives.
3. Add a small design-system diagram or inventory page in the docs app.
