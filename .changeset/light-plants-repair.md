---
"@ucdjs/utils": minor
---

feat(utils): enhance path filter functionality

- Introduced `extend` and `getFilters` methods to `PathFilter` for dynamic filter management.
- Updated `createPathFilter` to return a `PathFilter` instead of a function type.
- Refactored type references in related modules to use `PathFilter`.
