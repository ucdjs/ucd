# Glossary

Terms and concepts used in the UCD.js codebase and documentation.

## Core Concepts

### UCD

Unicode Character Database.

### Store

Depending on context, Store can mean the storage system managed by @ucdjs/ucd-store or the apps/store web app. Use surrounding context to disambiguate.

### UCD Store

Local or remote storage of UCD files, managed by @ucdjs/ucd-store.

### FS bridge

Filesystem abstraction for Node.js, HTTP, and in-memory backends.

### Pipelines

Primary extraction path for processing UCD data.

### Artifacts

Outputs produced by pipelines.

### Lockfile

Snapshot and integrity metadata for store contents.

## API and Client

### OpenAPI

Generated API specification derived from Zod schemas.

### Client

Type-safe API client generated from the OpenAPI spec (@ucdjs/client).

## Testing

### mockFetch

MSW-based helper for mocking HTTP fetch calls in tests (#test-utils/msw).

### MSW

Mock Service Worker, used for HTTP testing and request interception.

## Pipelines Terms

### Pipeline Definition

Typed description of a pipeline, defined in @ucdjs/pipelines-core and resolved by pipelines-loader.

### Pipeline Executor

Engine that runs pipelines and produces artifacts (@ucdjs/pipelines-executor).

### Pipeline Preset

Reusable pipeline configuration shared across packages (@ucdjs/pipelines-presets).

## Store Terms

### Snapshot

Stored representation of UCD file state used for integrity checks and caching.

### UCD Store API

Public access path for UCD files (apps/store) used by fs-bridge and clients.
