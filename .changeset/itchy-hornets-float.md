---
"@ucdjs-internal/shared": minor
---

## PathFilter API Changes

Updated the PathFilter API to use a configuration object with separate `include` and `exclude` arrays instead of mixing patterns with `!` prefixes.

**Before:**
```ts
const filter = createPathFilter(['*.js', '!*.test.js', '!**/node_modules/**']);
```

**After:**
```ts
const filter = createPathFilter({
  include: ['*.js'],
  exclude: ['*.test.js', '**/node_modules/**']
});
```

### API Changes
- `createPathFilter(patterns: string[])` → `createPathFilter(config: PathFilterOptions)`
- `filter.extend(patterns: string[])` → `filter.extend(config: Pick<PathFilterOptions, 'include' | 'exclude'>)`
- `filter.patterns(): string[]` → `filter.patterns(): PathFilterOptions`
- `filter(path, extraPatterns: string[])` → `filter(path, extraConfig: Pick<PathFilterOptions, 'include' | 'exclude'>)`

### Default Behavior
- If `include` is empty or not provided, includes everything using `**` pattern
- `exclude` patterns always override `include` patterns
- Default exclusions for `.zip` and `.pdf` files (can be disabled with `disableDefaultExclusions: true`)

### Updated PRECONFIGURED_FILTERS

Preconfigured filter constants now return arrays:

**Before:**
```ts
PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES // "!**/*Test*"
```

**After:**
```ts
PRECONFIGURED_FILTERS.TEST_FILES // ["**/*Test*"]
```

Available filters:
- `TEST_FILES`: `["**/*Test*"]`
- `README_FILES`: `["**/ReadMe.txt"]`
- `HTML_FILES`: `["**/*.html"]`
- `TEST_RELATED`: `["**/*.test.*", "**/*.spec.*", "**/__tests__/**"]`
