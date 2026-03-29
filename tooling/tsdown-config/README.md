# @ucdjs-tooling/tsdown-config

This package provides a set of [tsdown](https://github.com/rolldown/tsdown) configurations for the @ucdjs organization.

## Conventions

The factory encodes the default package shape used across this repo:

- entrypoint: `./src/index.ts`
- build tsconfig: `./tsconfig.build.json`
- output format: ESM with declaration files
- strict unresolved import handling during bundling

These defaults are convenient for the common package shape in this monorepo, but they are still overrides, not hard requirements. Packages with different entrypoints or build needs should pass explicit overrides.

## Usage

To use this package, import the factory function:

```typescript
// tsdown.config.ts
import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

// By default, only the ./src/index.ts file is included
export default createTsdownConfig({
  // your tsdown configuration options
});
```

## Override Example

```typescript
import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: ["./src/cli.ts"],
  format: ["esm", "cjs"],
});
```

## 📄 License

Published under [MIT License](./LICENSE).
