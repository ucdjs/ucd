# @ucdjs-tooling/tsdown-config

This package provides a set of [tsdown](https://github.com/rolldown/tsdown) configurations for the @ucdjs organization.

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

## 📄 License

Published under [MIT License](./LICENSE).
