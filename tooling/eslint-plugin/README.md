# @ucdjs/eslint-plugin

This package provides a set of [eslint rules](https://eslint.org/) specific to this repository.

## Usage

To use this package, import the ucdjs plugin:

```typescript
// eslint.config.js
// @ts-check
import { luxass } from "@luxass/eslint-config";
import ucdjsPlugin from "@ucdjs/eslint-plugin";

export default luxass({
  formatters: true,
})
  .append({
    plugins: {
      ucdjs: ucdjsPlugin,
    },
    files: [
      "**/*.openapi.ts",
    ],
    rules: {
      "ucdjs/no-hardcoded-openapi-tags": "error",
    },
  });
```

## Rules

There is currently only a single rule "ucdjs/no-hardcoded-openapi-tags".

## 📄 License

Published under [MIT License](./LICENSE).
