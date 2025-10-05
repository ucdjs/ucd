---
title: Path Utils
description: Security-focused path utilities for cross-platform path handling.
seo:
  title: "@ucdjs/path-utils"
  description: Security-focused path utilities for cross-platform path handling and secure path resolution in UCD.js.
navigation:
  icon: i-lucide-wrench
---

Security-focused utilities for working with file paths across platforms, with built-in protection against path traversal attacks and malicious inputs.

## Installation

::code-group

```bash [npm]
npm install @ucdjs/path-utils
```

```bash [pnpm]
pnpm add @ucdjs/path-utils
```

```bash [yarn]
yarn add @ucdjs/path-utils
```

::

## API Reference

:::card-group
::card{icon="i-lucide-shield-check" title="Security Functions" to="/packages/utilities/path-utils/security"}
`resolveSafePath`, `decodePathSafely`, `isWithinBase`
::

::card{icon="i-lucide-settings" title="Platform Utilities" to="/packages/utilities/path-utils/platform"}
Windows/Unix path utilities and platform detection
::

::card{icon="i-lucide-alert-triangle" title="Error Classes" to="/packages/utilities/path-utils/errors"}
Detailed error types and error handling
::

::card{icon="i-lucide-book-open" title="Examples" to="/packages/utilities/path-utils/examples"}
Real-world usage examples and patterns
::
:::
