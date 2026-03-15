# Critique: `packages/shared` (`@ucdjs-internal/shared`)

## Validation

- `pnpm exec vitest run --project=shared` -> 10 files, 357 tests passed
- `pnpm exec turbo run typecheck --filter=@ucdjs-internal/shared` -> passed
- `pnpm exec turbo run build --filter=@ucdjs-internal/shared` -> passed

This package is not failing locally. The criticism is mostly about boundaries, consumer contract, and long-term maintainability.

Review context update:

- In this repo, published `@ucdjs-internal/*` packages are intentional. The `internal` marker is being used as a volatility signal, not as a claim that the package must stay unpublished.
- Because of that, the criticism below is about churn management, blast radius, and boundary clarity, not about the mere fact that the package is published.

## Scores

- Consumer contract: `4/10`
- Maintainer DX: `5/10`
- Boundary discipline: `3/10`
- Documentation accuracy: `2/10`
- Runtime/test confidence: `7/10`

## Findings

### 1. The package uses the intentional `internal` volatility contract, but the blast radius is still too wide

Severity: medium

Evidence:

- The package is named `@ucdjs-internal/shared`, but it is published publicly via `publishConfig.access` in [packages/shared/package.json](/Users/luxass/dev/ucdjs/ucd/packages/shared/package.json#L65).
- The README explicitly says it is internal and not semver-stable in [packages/shared/README.md](/Users/luxass/dev/ucdjs/ucd/packages/shared/README.md#L7).
- Public packages depend on it directly, including [packages/client/package.json](/Users/luxass/dev/ucdjs/ucd/packages/client/package.json#L41) and [packages/utils/package.json](/Users/luxass/dev/ucdjs/ucd/packages/utils/package.json#L39).

Why this is valid criticism:

- With your clarified repo contract, the naming itself is not the bug.
- The real issue is that this volatility-marked package sits on a very broad dependency path, so patches here can cascade through many consumers quickly.
- That is acceptable when the team can migrate fast, but it still creates real DX and maintenance pressure and needs stronger boundaries than it has today.

Recommendation:

- Keep the `@ucdjs-internal/*` convention if it is working for your release model.
- Tighten who is allowed to depend on this package directly.
- Document what kinds of breakage are expected under the `internal` contract and what migration path consumers should expect.

### 2. `shared` has become a grab-bag package, not a coherent volatility boundary

Severity: high

Evidence:

- The root export surface mixes async helpers, fetch, debugging, file-tree helpers, filters, globbing, API guards, JSON, and Unicode version utilities in [packages/shared/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/shared/src/index.ts#L1).
- There is a separate config subpath export in [packages/shared/package.json](/Users/luxass/dev/ucdjs/ucd/packages/shared/package.json#L21), which adds yet another concern into the same package.
- Workspace usage is heavy: a repo search found `89` imports of `@ucdjs-internal/shared` and `4` imports of `@ucdjs-internal/shared/config`.
- `@ucdjs/utils` is effectively a thin wrapper over this package in [packages/utils/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/utils/src/index.ts#L1).

Why this is valid criticism:

- This package is doing the job of a junk drawer. It is not a stable abstraction, it is a convenience pile.
- High fan-out means every change here has broad blast radius.
- The existence of `@ucdjs/utils` as a public facade over an internal grab-bag is further evidence that the current package split is not expressing intent clearly enough.

Recommendation:

- Split by concern: fetch/http, unicode-version helpers, path filtering, config paths.
- Either make `@ucdjs/utils` the real public surface and move logic there, or remove it and create focused packages.
- Reduce the number of cross-workspace consumers that need this package directly.

### 3. Monorepo path aliases are masking packaging reality

Severity: high

Evidence:

- The workspace resolves `@ucdjs-internal/shared` and `@ucdjs-internal/shared/config` directly to source files via TS path aliases in [tooling/tsconfig/base.json](/Users/luxass/dev/ucdjs/ucd/tooling/tsconfig/base.json#L24).
- The actual published package only exposes `"."` and `"./config"` in [packages/shared/package.json](/Users/luxass/dev/ucdjs/ucd/packages/shared/package.json#L21).

Why this is valid criticism:

- Local development is not exercising the same boundary that consumers get from the published package.
- This is exactly the kind of setup that lets source reach-through, export drift, and packaging regressions survive until publish time.
- It matches your own repo-wide concern that testing and development often reference source directly instead of strict package boundaries.

Recommendation:

- Keep the alias only if you also add strict package-surface checks.
- Add at least one consumer-oriented test that imports the built package exports, not only workspace source aliases.
- Consider a CI job that resolves against `dist` or a packed tarball for published packages.

### 4. The build is not fully reproducible because it reaches out to production at build time

Severity: medium

Evidence:

- `packages/shared/tsdown.config.ts` fetches `https://api.ucdjs.dev/.well-known/ucd-config.json` during build in [packages/shared/tsdown.config.ts](/Users/luxass/dev/ucdjs/ucd/packages/shared/tsdown.config.ts#L4).
- The build falls back silently to hardcoded defaults if the fetch fails in [packages/shared/tsdown.config.ts](/Users/luxass/dev/ucdjs/ucd/packages/shared/tsdown.config.ts#L12).

Why this is valid criticism:

- Builds should not change based on network availability or production API state unless that is a deliberate release step.
- Right now the artifact can differ by time and connectivity, while still "passing."
- This is the wrong direction if you want deterministic releases and easier debugging.

Recommendation:

- Move the default config snapshot into source control or generate it in an explicit release task.
- Do not make package builds depend on live production fetches.

### 5. The package documentation is stale and misleading

Severity: medium

Evidence:

- The README says this package contains "filesystem bridge implementations" in [packages/shared/README.md](/Users/luxass/dev/ucdjs/ucd/packages/shared/README.md#L10), but those live elsewhere.
- The README examples call `createPathFilter` with an array, while the implementation accepts an options object in [packages/shared/README.md](/Users/luxass/dev/ucdjs/ucd/packages/shared/README.md#L24) and [packages/shared/src/filter.ts](/Users/luxass/dev/ucdjs/ucd/packages/shared/src/filter.ts#L121).
- The README references `PRECONFIGURED_FILTERS.EXCLUDE_*` names, but the implementation exposes `TEST_FILES`, `README_FILES`, and `HTML_FILES` in [packages/shared/README.md](/Users/luxass/dev/ucdjs/ucd/packages/shared/README.md#L56) and [packages/shared/src/filter.ts](/Users/luxass/dev/ucdjs/ucd/packages/shared/src/filter.ts#L52).

Why this is valid criticism:

- This is not just "docs could be nicer." The documented API is wrong.
- Wrong docs around an already boundary-confused package make adoption and refactoring harder.

Recommendation:

- Treat README examples as tested API contracts.
- Add doc-snippet validation or at minimum update the README whenever exported signatures change.

### 6. Dependency hygiene is weak for such a central package

Severity: medium

Evidence:

- `@ucdjs/env` is listed as a runtime dependency in [packages/shared/package.json](/Users/luxass/dev/ucdjs/ucd/packages/shared/package.json#L40), but it only appears in tests.
- `defu` is listed as a runtime dependency in [packages/shared/package.json](/Users/luxass/dev/ucdjs/ucd/packages/shared/package.json#L46), but there is no usage under `packages/shared/src`.
- Because this package is imported widely, unnecessary dependencies propagate through a large portion of the workspace.

Why this is valid criticism:

- A central package should be aggressively clean about dependencies.
- Every unnecessary dependency here increases install surface, audit surface, and conceptual noise for downstream packages.

Recommendation:

- Move test-only dependencies out of `dependencies`.
- Remove unused runtime dependencies.
- Re-check whether this package should carry `zod` as a runtime dependency or whether the type exposure should be isolated behind a narrower surface.

### 7. The fetch abstraction works, but its typing is still loose and cast-heavy

Severity: medium

Evidence:

- Public fetch types default heavily to `any` in [packages/shared/src/fetch/types.ts](/Users/luxass/dev/ucdjs/ucd/packages/shared/src/fetch/types.ts#L4).
- `FetchContext` drops the `T` generic from `options` in [packages/shared/src/fetch/types.ts](/Users/luxass/dev/ucdjs/ucd/packages/shared/src/fetch/types.ts#L78).
- The implementation uses multiple `as any` casts around errors, streams, and response plumbing in [packages/shared/src/fetch/fetch.ts](/Users/luxass/dev/ucdjs/ucd/packages/shared/src/fetch/fetch.ts#L87).

Why this is valid criticism:

- This package is supposed to be shared infrastructure. Loose typing here spreads low-confidence types into consumers.
- The code is good enough to pass tests, but it is not modeling its invariants as strictly as it should.
- This is the same general pattern you already called out elsewhere in pipelines: the repo often escapes difficult typing with casts instead of redesigning the API.

Recommendation:

- Narrow the fetch API around a few supported modes instead of trying to represent every possible fetch shape.
- Replace `any` defaults with `unknown` where possible.
- Tighten the internal error/result model before more packages adopt this helper.

### 8. The package is missing diagrams where diagrams would materially reduce confusion

Severity: medium

Evidence:

- The package mixes multiple concerns and sits in the middle of a large dependency fan-out, but there is no package-level diagram explaining ownership, public surface, or consumer categories.
- The current prose docs are not enough because the main problem here is structural ambiguity, not missing API snippets.

Why this is valid criticism:

- `shared` is exactly the kind of package that benefits from a simple diagram.
- Right now a reader has to infer too much: what belongs in `shared`, what should stay in `utils`, what is internal-only, and which packages are supposed to consume which surface.
- When architecture is fuzzy, missing diagrams become a real DX problem, not just a documentation nicety.

Recommendation:

- Add a small diagram to the README or docs showing:
- `@ucdjs/utils` as the intended public utility surface, if that is still the plan.
- `@ucdjs-internal/shared` as a volatility-marked internal surface that is still published.
- which concerns belong here: fetch, filtering, config, version helpers.
- which packages are allowed to depend on it directly.

## What is good

- The package has real tests and they are not trivial.
- The current behavior is stable enough that the issues are mostly architectural, not "it explodes on use."
- The file/filter and fetch utilities are clearly useful; the problem is packaging and ownership, not lack of value.

## Suggested next moves

1. Keep the intentional `@ucdjs-internal/*` contract, but define stricter dependency guardrails around it.
2. Fix the README so the package at least tells the truth today.
3. Remove unused and test-only runtime dependencies.
4. Break `shared` into smaller, intention-revealing modules before the dependency fan-out gets worse.
5. Add one strict consumer test path that validates built exports instead of source aliases.
