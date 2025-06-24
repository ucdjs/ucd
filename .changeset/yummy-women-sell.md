---
"@ucdjs/utils": minor
"@ucdjs/ucd-store": patch
---

Enhanced path filtering with extendable filters and temporary filter support.

```typescript
const filter = createPathFilter(['*.txt']);
filter.extend(['!*Test*']); // Add more patterns
filter('file.js', ['*.js']); // Use extra filters temporarily
```
