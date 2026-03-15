# Critique: `apps/docs` (`@ucdjs/docs`)

## Validation

- `pnpm --dir apps/docs run typecheck` -> passed
- `pnpm --dir apps/docs run build` -> passed

## Findings

- The docs app is not acting as source of truth for the repo. Several pages and package docs are visibly stale or generic, for example [apps/docs/content/architecture/ucd-store.mdx](/Users/luxass/dev/ucdjs/ucd/apps/docs/content/architecture/ucd-store.mdx), while multiple package READMEs repeat template text instead of real behavior.
- There is no validation layer for documentation quality beyond MDX compilation and linting. That means broken mental models can ship as long as the pages parse.
- The repo complexity now clearly exceeds prose-only docs. The docs site should be where package relationships, worker flows, and pipeline lifecycles are diagrammed, but that material is largely missing.
- The app has no tests. For a site that is supposed to carry architecture guidance, that means no link checking, no smoke coverage, and no guardrail against stale navigation or broken embedded assumptions.

## What is good

- The app builds and typechecks cleanly.
- It already contains architecture and contributing sections, so the structure for better docs exists.

## Suggested next moves

1. Treat docs drift as a product bug, not a packaging afterthought.
2. Add diagrams for storage, workers, and pipelines here, not scattered across comments.
3. Add at least smoke-level validation for key architecture pages and route health.
