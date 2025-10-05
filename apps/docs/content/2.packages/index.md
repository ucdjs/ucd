---
title: Packages
description: Explore the UCD.js package ecosystem.
navigation:
  icon: i-lucide-package
seo:
  title: Packages
  description: Documentation for all UCD.js packages and utilities.
---

UCD.js is organized as a monorepo with multiple packages, each serving a specific purpose in working with Unicode Character Database.

## Core Packages

::card-group
  :::card
  ---
  icon: i-lucide-database
  title: UCD Store
  to: /packages/ucd-store
  ---
  Store for managing Unicode Character Database files. Supports multiple file system bridges (Node.js, HTTP, in-memory).
  :::

  :::card
  ---
  icon: i-lucide-terminal
  title: CLI
  to: /packages/cli
  ---
  Command-line interface for UCD operations with the `ucd` binary.
  :::

  :::card
  ---
  icon: i-lucide-network
  title: Fetch
  to: /packages/fetch
  ---
  OpenAPI-based API client for the UCD API at api.ucdjs.dev.
  :::

  :::card
  ---
  icon: i-lucide-folder-tree
  title: FS Bridge
  to: /packages/fs-bridge
  ---
  File system abstraction layer that allows different storage backends.
  :::
::

## Schemas & Generation

::card-group
  :::card
  ---
  icon: i-lucide-shield-check
  title: Schemas
  to: /packages/schemas
  ---
  Zod schemas for Unicode data files with full type safety.
  :::

  :::card
  ---
  icon: i-lucide-sparkles
  title: Schema Gen
  to: /packages/schema-gen
  ---
  Uses AI (OpenAI) to generate TypeScript schemas from Unicode data files.
  :::
::

## Utilities

::card-group
  :::card
  ---
  icon: i-lucide-wrench
  title: Utilities
  to: /packages/utilities
  ---
  Shared utilities, path manipulation, and environment configuration packages.
  :::
::

## Package Compatibility

All packages are:
- Built with **TypeScript** for full type safety
- Distributed as **ES modules**
- Compatible with **Node.js >= 22.18**
- Tree-shakable for optimal bundle sizes

## Installation

Install individual packages as needed:

```bash [npm]
npm install @ucdjs/ucd-store
```

```bash [pnpm]
pnpm add @ucdjs/ucd-store
```

```bash [yarn]
yarn add @ucdjs/ucd-store
```
