---
"@ucdjs/fs-bridge": minor
"@ucdjs/ucd-store": minor
---

feat: migrate from @ucdjs/utils to @ucdjs-internal/shared

Updated internal imports to use `@ucdjs-internal/shared` instead of `@ucdjs/utils` for utilities like `safeJsonParse` and other shared patterns. This aligns with the new package structure where `@ucdjs-internal/shared` contains internal utilities and `@ucdjs/utils` focuses on public-facing utilities.
