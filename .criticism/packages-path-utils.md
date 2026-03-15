# Critique: `packages/path-utils` (`@ucdjs/path-utils`)

## Validation

- `pnpm --dir packages/path-utils run typecheck` -> passed
- `pnpm --dir packages/path-utils run build` -> passed
- package-local `test` script -> none

## Findings

- The package is security-sensitive, but the README in [packages/path-utils/README.md](/Users/luxass/dev/ucdjs/ucd/packages/path-utils/README.md) is effectively empty. That is valid criticism because this package is doing traversal prevention and decoding safeguards in [packages/path-utils/src/security.ts](/Users/luxass/dev/ucdjs/ucd/packages/path-utils/src/security.ts).
- The package mixes two roles: real UCD-specific security helpers and thin re-exports of generic `pathe` helpers from [packages/path-utils/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/path-utils/src/index.ts). That weakens the package identity.
- There are still unresolved edge-case comments in the tests, such as the Unix TODO in [packages/path-utils/test/security.unix.test.ts](/Users/luxass/dev/ucdjs/ucd/packages/path-utils/test/security.unix.test.ts).
- The test suite is substantial, but the package still has no package-local `test` script, which undermines one of the better-tested boundaries in the repo.
- A simple threat-model diagram would be more useful here than another short README paragraph: encoded input -> decode -> normalize -> containment check -> safe output.

## What is good

- The package appears to take path safety seriously.
- Build and typecheck are clean, and the test tree is solid.

## Suggested next moves

1. Document the security model explicitly instead of leaving it in source and tests.
2. Decide whether generic `pathe` re-exports belong here.
3. Add package-local test execution and a small path-safety diagram.
