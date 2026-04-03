# @ucdjs/pipeline-presets

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

Ready-made parsers, resolvers, routes, transforms, and full pipeline definitions for common Unicode Character Database files.

## Installation

```bash
npm install @ucdjs/pipeline-presets
```

## Usage

### Pre-built pipelines

Create complete pipelines with sensible defaults:

```ts
import { createBasicPipeline, createEmojiPipeline, createFullPipeline } from "@ucdjs/pipeline-presets";

const basic = createBasicPipeline({ /* options */ });
const emoji = createEmojiPipeline({ /* options */ });
const full = createFullPipeline({ /* options */ });
```

### Parsers

Parse standard UCD file formats:

```ts
import {
  standardParser,
  multiPropertyParser,
  sequenceParser,
  unicodeDataParser,
} from "@ucdjs/pipeline-presets";
```

- `standardParser` - semicolon-delimited property files (e.g. `PropList.txt`)
- `multiPropertyParser` - files with multiple property columns
- `sequenceParser` - sequence-based files (e.g. `emoji-sequences.txt`)
- `unicodeDataParser` - `UnicodeData.txt` format

### Resolvers

Resolve how parsed data maps to output files:

```ts
import { createGroupedResolver, propertyJsonResolver } from "@ucdjs/pipeline-presets";
```

### Routes

Pre-defined routes for common UCD files:

```ts
import {
  allRoutes,
  coreRoutes,
  emojiRoutes,
  unicodeDataRoute,
  generalCategoryRoute,
  scriptsRoute,
} from "@ucdjs/pipeline-presets";
```

### Transforms

Filter and transform pipeline data:

```ts
import { createFilterByPipelineFilter, createRowFilter } from "@ucdjs/pipeline-presets";
```

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/pipeline-presets?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/pipeline-presets
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/pipeline-presets?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/pipeline-presets
