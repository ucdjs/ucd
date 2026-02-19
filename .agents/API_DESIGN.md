# API Design Principles

API design principles for UCD.js, focusing on compatibility between API and Store, versioning, and maintainability.

## Core Principles

### 1. API + Store Compatibility First

The API and Store are public access paths and must remain consistent.

**Goals:**

- API compatibility: stable, versioned endpoints
- Store compatibility: stable URLs and file layouts
- Client compatibility: OpenAPI-driven types and predictable responses

### 2. Stability Over Convenience

Prefer additive changes over breaking changes. If a change is unavoidable, document it and provide a migration path.

### 3. Type Safety

Public APIs should be type-safe with strong TypeScript support.

**Guidelines:**

- OpenAPI spec is generated from Zod schemas
- The @ucdjs/client package is generated from OpenAPI
- Avoid `any` in public API shapes

### 4. Developer Experience

APIs should be predictable and well-documented.

**Guidelines:**

- Descriptive names
- Clear error messages
- Examples in docs

## API Design Patterns

### Versioned API

- API paths are versioned (v1)
- Keep compatibility in mind for public routes and payloads

Core routes:

- /api/v1/files
- /api/v1/versions
- /api/v1/schemas
- /_tasks
- /.well-known/

### Store Interface

- Store provides direct file access and metadata
- Store URLs and file layouts must remain stable
- Prefer additive changes and avoid breaking paths

## OpenAPI Workflow

- OpenAPI spec is generated from Zod schemas
- After changing API routes or schemas, run `pnpm build:openapi` in apps/api
- Update @ucdjs/client expectations if schema changes

## Versioning Strategy

- Follow semver for public-facing changes
- Breaking changes require clear documentation and migration guidance

## Error Handling

- Provide clear, actionable error messages
- Include context (file paths, versions, request details)

## Testing Requirements

- API changes must include tests (apps/api/test)
- Store changes must include tests that validate file layout and metadata

## Best Practices

- Keep routes and payloads stable
- Avoid hidden coupling between API and Store
- Update docs when behavior changes

## Resources

- .agents/ARCHITECTURE.md
- .agents/COMMON_PATTERNS.md
- apps/docs (source docs)
