---
"@ucdjs/utils": minor
---

BREAKING: Remove most exports from @ucdjs/utils package

Most utility functions have been moved to the internal `@ucdjs-internal/shared` package to better organize the monorepo's internal utilities. If you were using any of the removed functions, you can install `@ucdjs-internal/shared` directly, but note that this package is internal and may change without being marked as breaking changes.

The `@ucdjs/utils` package now focuses on stable, user-facing utilities only.
