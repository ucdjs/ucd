---
title: Utilities
description: Shared utilities and helper packages.
navigation:
  icon: i-lucide-wrench
seo:
  title: Utility Packages
  description: Documentation for UCD.js utility packages - shared, path-utils, and env.
---

The UCD.js ecosystem includes several utility packages that provide common functionality across the project.

## Available Packages

::card-group
  :::card
  ---
  icon: i-lucide-box
  title: Shared
  to: /packages/utilities/shared
  ---
  Shared utilities used across UCD.js packages.
  :::

  :::card
  ---
  icon: i-lucide-folder
  title: Path Utils
  to: /packages/utilities/path-utils
  ---
  Path manipulation utilities for working with file paths.
  :::

  :::card
  ---
  icon: i-lucide-settings
  title: Environment
  to: /packages/utilities/env
  ---
  Environment configuration and variable management.
  :::
::

## When to Use

These utility packages are primarily intended for:
- **Internal use** within other UCD.js packages
- **Advanced users** building custom tooling on top of UCD.js
- **Contributors** developing new features for the ecosystem

Most users working with Unicode data should start with the core packages like `@ucdjs/ucd-store` or `@ucdjs/cli`.

## Installation

Install utility packages individually:

```bash [npm]
npm install @ucdjs/shared @ucdjs/path-utils @ucdjs/env
```

```bash [pnpm]
pnpm add @ucdjs/shared @ucdjs/path-utils @ucdjs/env
```

```bash [yarn]
yarn add @ucdjs/shared @ucdjs/path-utils @ucdjs/env
```
