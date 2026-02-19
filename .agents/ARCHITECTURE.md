# Architecture

High-level architecture of UCD.js, including core components, data flow, and design decisions.

## Overview

UCD.js is a monorepo for working with Unicode Character Database (UCD) files. The architecture centers on storage, pipelines (the internal extraction path), and API/CLI access paths that expose and orchestrate data.

## High-Level Architecture

```text
UCD source files
      ↓
Storage + Bridge (ucd-store / fs-bridge)
   ↙           ↘
API + Store   Pipelines (internal build path)
   ↓               ↓
Consumers (API)  Artifacts / Data Packages → Consumers (NPM packages)
   ↖
   CLI + Apps (local workflows)
```

### Layer Separation

1. **Storage layer**: @ucdjs/ucd-store, @ucdjs/fs-bridge, @ucdjs/lockfile
2. **Pipeline layer**: @ucdjs/pipelines-* (core, loader, executor, artifacts, graph)
3. **API and Store**: apps/api (OpenAPI), apps/store (direct file access)
4. **CLI and Apps**: @ucdjs/cli, apps/web, apps/docs

## Core Components

### Storage + Filesystem

Storage access flows through fs-bridge (Node.js, HTTP, in-memory). ucd-store manages file access and metadata. lockfile/snapshot utilities track integrity and state.

### Pipelines (Extraction and Build Path)

- pipelines-core defines types and structure
- pipelines-loader resolves definitions
- pipelines-executor runs pipelines
- pipelines-artifacts stores outputs
- pipelines-graph handles execution ordering

### API and Store

- apps/api exposes versioned endpoints and OpenAPI schema
- apps/store provides direct access to UCD files and metadata

### CLI

@ucdjs/cli orchestrates local workflows. It can run pipelines, explore files locally, and call the API directly (for example: `ucd files get 17.0.0/ArabicShaping.txt`). Run it from the repo root during development so it uses workspace sources.

## Data Flow

The data flow is intentionally high-level. Specific workflows (CLI using API, local store cloning, pipeline execution) are described in .agents/COMMON_PATTERNS.md and in the docs.

At a high level:

1. Unicode source data is accessed through storage backends via fs-bridge and ucd-store.
2. API and Store access the storage layer directly for files, metadata, and schemas.
3. Internal pipelines run during build to extract and generate artifacts/data packages.
4. Consumers typically access data via the API or published data packages (when available).

## Generated Outputs

Do not edit generated output (for example: dist/, ucd-generated/). Change source and rebuild.

## Resources

- .agents/API_DESIGN.md
- .agents/COMMON_PATTERNS.md
- apps/docs (source docs)
