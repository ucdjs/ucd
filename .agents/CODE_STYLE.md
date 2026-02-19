# Code Style Guide

Coding standards and conventions for the UCD.js project.

## General Principles

- **Consistency**: Follow existing patterns
- **Clarity**: Write readable code
- **Maintainability**: Consider future contributors
- **Correctness**: Prefer explicit behavior over cleverness

## TypeScript/JavaScript Code Style

### Formatting

- Use the repo's formatting rules (lint applies them).
- Keep changes aligned with existing file style.

### Naming Conventions

- **Types/Interfaces**: PascalCase
- **Classes**: PascalCase
- **Functions**: camelCase
- **Variables**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE or camelCase (match file conventions)
- **Files**: match main export (camelCase.ts or PascalCase.ts)

### Imports and Boundaries

- Prefer path aliases where established (e.g. #test-utils/* in tests).
- Avoid reaching into dist/ or generated output.
- Keep internal-only packages scoped to internal consumers.
- Prefer workspace imports over built outputs during development.

### Error Handling

- Throw descriptive errors with context.
- Avoid swallowing errors; propagate with detail.

### Async Code

- Prefer async/await over chained promises.
- Use Promise.all for parallel work when safe.

### Comments

- Explain "why" not "what".
- Avoid comments that restate the code.

## Testing

- Use Vitest for tests.
- Use #test-utils/* for shared helpers.
- Prefer mockFetch from #test-utils/msw for HTTP/MSW-driven tests.

## Generated Output

- Do not edit generated output (for example: dist/, ucd-generated/). Change source and rebuild.

## Tools

- **Linting**: `pnpm run lint`
- **Type checking**: `pnpm run typecheck`

## Resources

- .agents/CODE_STYLE.md
- .agents/COMMON_PATTERNS.md
