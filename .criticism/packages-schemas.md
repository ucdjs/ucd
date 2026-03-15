# Critique: `packages/schemas` (`@ucdjs/schemas`)

## Validation

- `pnpm --dir packages/schemas run typecheck` -> passed
- `pnpm --dir packages/schemas run build` -> passed
- package-local `test` script -> none

## Revised position

This package is central, and that is appropriate.

Unlike some other packages, the main criticism here is not "this package is doing too much." A central schema package is supposed to cover multiple contract families. The valid criticism is that those families are not documented or presented clearly enough, so the package reads flatter and more kitchen-sink than it actually is.

## Findings

### 1. The README is too thin for such a central contract package

Severity: high

Evidence:

- [packages/schemas/README.md](/Users/luxass/dev/ucdjs/ucd/packages/schemas/README.md) is extremely minimal.
- This package is imported across API, Store, client, web, lockfile, worker-utils, fs-bridge, `ucd-store`, test-utils, and more.

Why this is valid criticism:

- This package is one of the shared truth layers of the repo.
- Minimal docs are acceptable for a low-level helper package, but not for a schema package that defines cross-package contracts.

What to do:

- Expand the README to explain the schema families:
- API and well-known config
- filesystem/store manifest shapes
- lockfile and snapshot state
- Unicode version and file-tree schemas
- Include a few examples of real consumer imports.

### 2. The package is centralized correctly, but the schema families are not surfaced clearly enough

Severity: medium

Evidence:

- [packages/schemas/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/schemas/src/index.ts) exports API schemas, filesystem/store schemas, lockfile/snapshot schemas, manifest schemas, and Unicode schemas all from the root.
- Source files are already separated sensibly in:
- [packages/schemas/src/api.ts](/Users/luxass/dev/ucdjs/ucd/packages/schemas/src/api.ts)
- [packages/schemas/src/fs.ts](/Users/luxass/dev/ucdjs/ucd/packages/schemas/src/fs.ts)
- [packages/schemas/src/lockfile.ts](/Users/luxass/dev/ucdjs/ucd/packages/schemas/src/lockfile.ts)
- [packages/schemas/src/manifest.ts](/Users/luxass/dev/ucdjs/ucd/packages/schemas/src/manifest.ts)
- [packages/schemas/src/unicode.ts](/Users/luxass/dev/ucdjs/ucd/packages/schemas/src/unicode.ts)

Why this is valid criticism:

- The underlying structure is better than the old criticism implied.
- The problem is not that these schema families coexist.
- The problem is that the package does not tell consumers how to think about those families and who uses which ones.

What to do:

- Document schema families explicitly in the README and docs.
- Consider whether subpath exports are useful later, but documentation clarity matters more than package splitting right now.

### 3. Tool-driven schema compromises should be documented as deliberate tradeoffs

Severity: medium

Evidence:

- [packages/schemas/src/unicode.ts](/Users/luxass/dev/ucdjs/ucd/packages/schemas/src/unicode.ts) contains explicit comments about OpenAPI/Hono recursive schema limitations.

Why this is valid criticism:

- This is a real tradeoff, not a code smell by itself.
- But it affects how consumers interpret the schema design, so it should be explained somewhere more visible than source comments.

What to do:

- Add a short note in docs or README about why some schema definitions look more manual than ideal.
- Treat those comments as part of the package’s public design rationale.

### 4. The package needs package-local test execution

Severity: low

Evidence:

- There is no `test` script in [packages/schemas/package.json](/Users/luxass/dev/ucdjs/ucd/packages/schemas/package.json).
- The package does have tests under [packages/schemas/test](/Users/luxass/dev/ucdjs/ucd/packages/schemas/test).

Why this is valid criticism:

- This is a DX issue, not a schema-design issue.
- But a central contract package should be easy to validate directly.

What to do:

- Add a package-local `test` script or clearly document the project-level validation command.

### 5. A schema-consumer map would add more value than more prose

Severity: low

Evidence:

- The package is imported by many parts of the repo, but there is no simple map showing which schema families are used by which packages.

Why this is valid criticism:

- This package is a shared contract hub.
- A small diagram or table would immediately improve maintainability.

What to do:

- Add a small consumer map such as:
- client/api -> API and version schemas
- Store/lockfile/ucd-store -> manifest, lockfile, snapshot, filesystem schemas
- web/vscode -> Unicode version and file-tree schemas

## What is good

- This is one of the healthier central packages in the repo.
- The source is already split into reasonable schema families.
- The package really is serving as a shared contract layer across the monorepo.

## Suggested next moves

1. Expand the README so it explains schema families and real consumers.
2. Document tool-driven tradeoffs like recursive schema limitations.
3. Add a package-local `test` script or documented validation path.
4. Add a schema-family consumer map or diagram.
