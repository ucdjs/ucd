# Version And Dev Workflow Notes

Working notes for version lifecycle, local API setup, and generated artifact workflow. This is intentionally operational and can evolve as the architecture settles.

## Current Model

- `@unicode-utils/core` is the support metadata source of truth.
- R2 manifests are the published artifact source of truth.
- D1 `versions` is a derived operational index used by read endpoints such as `/api/v1/versions`.

## Current Code State

- `reindex-versions` is metadata-only.
  - It validates requested versions against `@unicode-utils/core`.
  - It does not read R2.
  - It clears manifest-related D1 columns (`manifestPath`, `snapshotPath`, `fileCount`, `totalSize`, `publishedAt`) to `null`.
- local `setup-dev`
  - reindexes only the same explicit version list it will seed manifests for
  - waits for the real Wrangler worker URL instead of assuming `127.0.0.1:8787`
- deployed automation
  - still calls `reindex-versions` with no explicit `versions` list
  - therefore indexes every version present in `@unicode-utils/core`
  - this means preview/production currently follow the full support list, not just a locally seeded subset

## Settled Decision

- `/api/v1/versions` returns the versions UCD.js supports.
- The support set is defined by `@unicode-utils/core`.
- D1 remains the backing store for `/api/v1/versions`, but it is a derived copy of that support metadata.
- Reindexing D1 should therefore use `@unicode-utils/core` metadata directly, not R2 manifest presence.
- Manifest publication is a separate concern from support metadata.

## Command Boundaries

- `refresh-manifests`
  - Generates manifests.
  - Uploads manifests through the tasks endpoint.
  - Should stay focused on publish/update behavior.
- `reindex-versions`
  - Rebuilds D1 `versions` rows from support metadata.
  - Is an explicit repair/backfill command.
- Manifest upload workflow
  - Publishes manifest files to R2.
  - Does not own support indexing in D1.

## Important Design Rules

- Publishing should not depend on the health of a D1-backed read endpoint.
- Migrations own schema.
- Reindex owns data only.
- Runtime recovery code should not carry its own hand-maintained schema SQL.
- D1 `versions` should be treated as a persisted projection of support metadata, not as the root definition of support.

## Local Development

Current local setup path:

- `apps/api#dev:setup`
  - applies local D1 migrations
  - runs `ucdjs-scripts setup-dev`
- `setup-dev`
  - reindexes local D1 from support metadata for the same seeded version list
  - starts the real local API worker
  - generates manifests for a predefined version set
  - uploads those manifests through the local tasks API

This is useful, but it currently mixes several concerns:

- schema initialization
- local artifact seeding
- full worker bootstrapping

## Recommended Direction

Keep `dev:setup`, but narrow its meaning:

- it should mean "initialize local API state so the app is usable"
- it should not become the catch-all command for every workflow

Recommended split:

- `dev:setup`
  - apply local D1 migrations
  - reindex local D1 for the same seeded version list
  - seed a small default manifest set for local use
- `setup-dev --versions ...`
  - explicit heavier seeding path when broader coverage is needed
- `dev`
  - just run the worker

## API Source Findings

After reading the full `apps/api/src` tree:

- `/api/v1/versions` is fully D1-backed.
- `/api/v1/versions/{version}` is fully D1-backed for metadata, with extra statistics read from R2 when available.
- `/.well-known/ucd-config.json` is also D1-backed for the `versions` array.
- `/api/v1/versions/{version}/file-tree` does not use D1. It traverses upstream Unicode.org directly.
- `/api/v1/versions/{version}/manifest` and `/.well-known/ucd-store/{version}.json` read manifests from R2.
- The manifest upload workflow writes published manifest files to R2 and purges caches, but does not write D1 support rows.

## Implementation Direction

Given the settled support contract, the implementation should be:

- `reindex-versions`
  - seeds or repairs D1 from `@unicode-utils/core`
  - does not depend on R2 manifest presence
- manifest upload workflow
  - only publishes artifacts and purges caches
- `refresh-manifests`
  - should not use the D1-backed `/api/v1/versions/{version}` endpoint as publish control flow
  - should decide skip/upload from manifest availability and manifest ETag only

In other words:

- D1 is the support index
- R2 is the published artifact store
- refresh logic should not use the health of the support index to decide whether publishing should run
- upload does not update D1; reindex is the only support-sync path

## Implemented Change

- `packages/ucdjs-scripts/src/commands/refresh-manifests.ts`
  - no longer checks `/api/v1/versions/{version}` during skip logic
  - now decides skip/upload only from remote manifest ETag presence and equality
  - if the remote manifest is missing or has no ETag, it uploads
- `apps/api/src/workflows/manifest-upload.ts`
  - no longer writes support rows into D1 after upload
  - upload is now purely about publishing artifacts and purging caches
  - no longer carries unused metadata-only fields through the upload task payload
- `packages/ucdjs-scripts/src/commands/setup-dev.ts`
  - reindexes local D1 for the same seeded version list before seeding manifests
  - uses the actual URL returned by `unstable_startWorker()` instead of assuming `127.0.0.1:8787`
- `apps/api/src/routes/tasks/routes.ts`
  - purges the cached support endpoints after reindex succeeds
  - returns a specific error if migrations have not created the `versions` table yet
  - clears manifest-related D1 columns during metadata-only reindex
- `apps/api/src/workflows/manifest-upload.ts`
  - purges the actual manifest and version-detail cache names after upload
- `.github/workflows/reusable-deploy-app.yml`
  - runs `/_tasks/reindex-versions` after API deploys
- `.github/workflows/refresh-manifest.yaml`
  - runs `/_tasks/reindex-versions` before scheduled/manual manifest refresh
  - no longer tries to purge a stale well-known cache target afterward

## Generated Artifacts

Generated artifacts should be synchronized explicitly, not hidden inside unrelated runtime commands.

Suggested root-level sync command:

- build OpenAPI from `apps/api`
- generate client types in `packages/client`
- generate Wrangler types where needed

This should be easy to run manually and easy to enforce in CI.

## Open Questions

- Should local `dev:setup` seed only a minimal set by default?
- Should generated contract artifacts have a dedicated root command such as `sync:generated`?
- Should preview/production `versions` always be manifest-consistent, or is it acceptable for deployed `reindex-versions` to list support metadata before manifests are refreshed?
- If strict manifest consistency is required outside local dev, should deploy and scheduled refresh run `refresh-manifests` before `reindex-versions`, or should `reindex-versions` itself become artifact-aware again?
