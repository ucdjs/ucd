# Critique: `packages/utils` (`@ucdjs/utils`)

## Validation

- `pnpm exec vitest run --project=utils` -> 1 file, 1 test passed
- `pnpm exec turbo run typecheck --filter=@ucdjs/utils` -> passed
- `pnpm exec turbo run build --filter=@ucdjs/utils` -> passed

This package is technically healthy because it is tiny. The real issue is that its public contract is misleading and its value proposition is currently weak.

Review context update:

- In this repo, published `@ucdjs-internal/*` packages are intentional and are used to signal volatility.
- Because of that, the main criticism here is not that `utils` depends on an internal package. The criticism is that `utils` is not acting like a curated facade with clear ownership.

## Scores

- Consumer value: `2/10`
- Maintainer clarity: `3/10`
- Documentation accuracy: `2/10`
- Boundary discipline: `4/10`
- Runtime/test confidence: `3/10`

## Findings

### 1. The package markets itself as a public utility package, but it never became a curated facade

Severity: high

Evidence:

- The implementation is effectively two re-exports and one placeholder function in [packages/utils/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/utils/src/index.ts#L1).
- The built package is tiny: the build output reports `0.64 kB`.
- The package depends entirely on `@ucdjs-internal/shared` in [packages/utils/package.json](/Users/luxass/dev/ucdjs/ucd/packages/utils/package.json#L39), which is acceptable under your repo contract but still means `utils` has almost no owned shape of its own.

Why this is valid criticism:

- A public package should have a clear reason to exist.
- Right now `@ucdjs/utils` looks less like a product and more like a facade that never got curated.
- That is fine as a temporary migration tactic, but not as a stable package identity.

Recommendation:

- Decide whether `@ucdjs/utils` is:
- the real public utility package with owned implementations, or
- a temporary compatibility shim that should be deprecated clearly.

### 2. The package exports a placeholder/internal joke function in a public package

Severity: high

Evidence:

- `internal_bingbong` is exported publicly in [packages/utils/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/utils/src/index.ts#L4).
- The package's only test verifies that placeholder console output in [packages/utils/test/index.test.ts](/Users/luxass/dev/ucdjs/ucd/packages/utils/test/index.test.ts#L3).

Why this is valid criticism:

- This is not harmless. It signals that the package surface is not being curated seriously.
- A public package with a novelty export and no meaningful behavioral tests looks abandoned or unserious to consumers.
- It also wastes the only test coverage the package has.

Recommendation:

- Remove `internal_bingbong`.
- Replace the current test with actual public API contract tests.

### 3. The docs are materially out of sync with the actual package API

Severity: high

Evidence:

- The README claims this package is "A collection of utility functions and filesystem bridge implementations" in [packages/utils/README.md](/Users/luxass/dev/ucdjs/ucd/packages/utils/README.md#L7), which is false.
- The README examples use the wrong `createPathFilter` API shape in [packages/utils/README.md](/Users/luxass/dev/ucdjs/ucd/packages/utils/README.md#L21).
- The README references non-existent `PRECONFIGURED_FILTERS.EXCLUDE_*` values in [packages/utils/README.md](/Users/luxass/dev/ucdjs/ucd/packages/utils/README.md#L53).
- The docs site also references a non-existent `PRECONFIGURED_FILTERS.dataFiles` value in [apps/docs/content/api-reference/utilities/utils.mdx](/Users/luxass/dev/ucdjs/ucd/apps/docs/content/api-reference/utilities/utils.mdx#L36).

Why this is valid criticism:

- Consumers reading the docs will get a false picture of what this package is and what it exports.
- This is more severe here than in `shared`, because `utils` is the package that appears intended for external use.
- In practice, your public docs are advertising an API that does not exist.

Recommendation:

- Make docs part of the release contract for public packages.
- Either update the package to match the docs or rewrite the docs to match reality.

### 4. The package has almost no real consumer footprint inside the repo

Severity: medium

Evidence:

- A repo search found no real source imports of `@ucdjs/utils` outside documentation examples.
- The references are basically docs and changelog history, not active code paths.

Why this is valid criticism:

- If your own codebase does not rely on the public package, the package is not being battle-tested.
- That usually means it will drift, decay, or become documentation fiction.
- This is another signal that the current package boundary is not trusted even by the monorepo itself.

Recommendation:

- Either dogfood `@ucdjs/utils` from actual consumers, or demote/deprecate it.
- Do not keep public packages alive only through README claims.

### 5. The current testing strategy gives almost zero confidence in the public contract

Severity: medium

Evidence:

- The package has one test, and it only covers `internal_bingbong` in [packages/utils/test/index.test.ts](/Users/luxass/dev/ucdjs/ucd/packages/utils/test/index.test.ts#L3).
- None of the documented path filtering behavior is validated at the `@ucdjs/utils` package level.

Why this is valid criticism:

- Passing tests here do not mean the package contract is healthy.
- The package is public-facing, but its tests are not validating the public contract at all.
- This is exactly how stale docs and accidental exports survive.

Recommendation:

- Add contract tests for every public re-export that `utils` intends to stand behind.
- If `utils` is just a forwarding package, test the forwarding behavior explicitly and minimally.

### 6. The package has no ownership story relative to `shared`

Severity: medium

Evidence:

- Changelog history says `@ucdjs/utils` now focuses on stable, user-facing utilities, while `@ucdjs-internal/shared` contains volatility-marked internal utilities.
- The actual implementation does not create that separation; it forwards directly into `shared` in [packages/utils/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/utils/src/index.ts#L1).

Why this is valid criticism:

- You have an intended architecture, but the code is not enforcing it.
- This makes future refactors harder because consumers, maintainers, and docs are all operating on different mental models.

Recommendation:

- Write down the package ownership rule explicitly:
- what must live in `utils`
- what must never leak from `shared`
- when a public re-export is acceptable

### 7. The package is missing diagrams that explain its relationship to the internal utility layer

Severity: medium

Evidence:

- There is no diagram showing how `@ucdjs/utils` relates to `@ucdjs-internal/shared`.
- That relationship is the most important thing to understand about this package, and it currently has to be inferred from source and changelog history.

Why this is valid criticism:

- This package has almost no implementation, so its meaning is architectural.
- Architectural packages need visual documentation more than API-heavy packages do.
- Without a diagram, the package reads like a broken or unfinished abstraction.

Recommendation:

- Add a simple diagram in the docs showing:
- consumer code -> `@ucdjs/utils` -> curated exports -> underlying `@ucdjs-internal/*` implementation
- whether `@ucdjs/utils` is a stable facade, migration layer, or both

## What is good

- The package builds cleanly.
- The small surface means it would be easy to fix once the ownership decision is made.
- If you choose to keep it, it can still become a strong public facade because the implementation cost is currently low.

## Suggested next moves

1. Remove the placeholder export and its test.
2. Decide whether `@ucdjs/utils` is a real public package or a temporary shim.
3. Fix the README and docs site immediately, because they are currently advertising the wrong API.
4. Add a small package relationship diagram for `utils` vs `shared`.
5. Either dogfood the package in real repo code or deprecate it.
