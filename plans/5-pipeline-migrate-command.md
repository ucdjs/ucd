# Pipeline Migrate Command

## Summary

Add an explicit `ucd pipelines migrate` command for preparing the local pipeline server database, while preserving auto-migration for local development.

The goal is:

- local development remains frictionless through auto-migration
- CI and other headless environments can use a dedicated non-interactive command
- startup failures clearly explain how to resolve missing migrations

## Desired UX

### Local CLI workflow

When a user runs:

```bash
ucd pipelines run --ui
```

and the local pipeline database needs migrations:

- the local dev flow should auto-run migrations
- the server should then continue startup normally

This keeps local development convenient and avoids adding a repetitive setup step.

### Headless workflow

When the same startup path runs in CI or another non-interactive environment:

- no prompt should be shown
- auto-migration should be disabled for that mode
- the command should fail fast
- the error should clearly say that migrations are required and that `ucd pipelines migrate` must be run first

This gives CI a deterministic setup step.

## Command Shape

Add:

```bash
ucd pipelines migrate
```

Behavior:

- creates the UCD config directory if needed
- opens the local pipeline database
- applies all pending migrations
- exits successfully when the database is ready
- prints a short success message

This command should be safe to run repeatedly.

## Separation Of Responsibilities

### No interactive prompt needed

The local dev behavior should be automatic rather than prompt-driven.

Reasoning:

- local development should stay low-friction
- prompting still blocks startup and adds unnecessary repetition
- CI and library consumers still need deterministic non-interactive behavior

### Server package needs mode-aware startup

`@ucdjs/pipeline-server` should support both:

- auto-migration when explicitly running in local development mode
- fail-fast behavior when running in headless or CI-oriented mode

Instead, server startup should:

- know whether auto-migration is allowed for the current startup mode
- run migrations automatically only when allowed
- throw a dedicated migrations-required error otherwise

This keeps local development convenient without making CI implicit.

## Implementation Plan

### 1. Add migration readiness detection

In the pipeline server DB layer:

- add a helper that can determine whether the local database is missing required migrations
- keep this separate from `runMigrations()`
- make it reusable by both server startup and the CLI

The simplest acceptable implementation is to detect whether the schema metadata table or required app tables exist. A more robust version can compare the current DB state with the migrations journal expected by Drizzle.

### 2. Add a dedicated migrations-required error

Introduce a specific error type in the pipeline server package for the not-migrated case.

The message should clearly tell the caller that:

- pipeline database migrations are required
- they can run `ucd pipelines migrate`
- interactive callers may choose to prompt the user

This avoids parsing generic SQLite or Drizzle errors.

### 3. Make server startup mode-aware

Change `startServer()` so it does not always apply the same migration behavior in every environment.

Instead:

- create the database
- if auto-migration is enabled for the current startup mode, run migrations before startup
- otherwise check readiness and throw the dedicated error if migrations are required
- continue startup only when the database is already ready

This should preserve frictionless local dev while allowing strict CI behavior.

### 4. Add `ucd pipelines migrate`

Extend the CLI `pipelines` command tree with a new `migrate` subcommand.

Implementation should:

- wire the new subcommand into help output
- create the config directory if needed
- create the pipeline DB
- call `runMigrations()`
- print success output

This command should be fully non-interactive.

### 5. Make CLI startup choose the correct mode

In the CLI UI startup path:

- default local interactive usage should enable auto-migration
- CI or explicit non-interactive usage should disable auto-migration
- when auto-migration is disabled and migrations are required, exit with guidance to run `ucd pipelines migrate`

This keeps the current convenience for local development while creating a strict mode for automation.

### 6. Keep dev-only tooling aligned

There is also a Vite dev server plugin for the pipeline server package.

The internal Vite dev plugin should stay on the auto-migrate path unless there is a strong reason to force strict mode there too.

Recommended default:

- local dev plugin auto-migrates
- local CLI UI startup auto-migrates
- CI and explicit strict/headless startup do not auto-migrate

## Files Likely Affected

- `packages/cli/src/cmd/pipelines/root.ts`
- `packages/cli/src/cmd/pipelines/run.ts`
- `packages/cli/src/cmd/pipelines/migrate.ts`
- `packages/pipelines/pipeline-server/src/server/app.ts`
- `packages/pipelines/pipeline-server/src/server/db/index.ts`
- `packages/pipelines/pipeline-server/build-plugins/h3-dev-server.ts`
- `apps/docs/content/packages/cli/pipelines.mdx`
- `apps/docs/content/pipelines/running.mdx`

## Test Cases

- `ucd pipelines migrate` succeeds on a fresh local database
- `ucd pipelines migrate` succeeds when rerun on an already migrated database
- `ucd pipelines run --ui` auto-migrates in local dev mode
- non-interactive startup fails without prompting and suggests `ucd pipelines migrate`
- direct `startServer()` callers receive the dedicated migrations-required error

## Non-Goals

This plan does not include:

- changing Drizzle migration generation workflow
- changing the pipeline database schema itself
- adding an interactive migration prompt

## Acceptance Criteria

This work is complete when:

- `ucd pipelines migrate` exists and prepares the local pipeline DB
- local dev startup still auto-migrates
- headless startup does not rely on prompts or implicit migration
- failure messages clearly direct users to `ucd pipelines migrate`
