---
"@ucdjs/shared": minor
---

feat: add new @ucdjs/shared package for internal utilities

This new package contains internal utilities and patterns used across the UCD monorepo, including:
- `safeJsonParse` utility for safe JSON parsing
- Foundation for shared Result types and async utilities

This package is internal and may change without semver constraints. External users should use `@ucdjs/utils` for stable utilities.
