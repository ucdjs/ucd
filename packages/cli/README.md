# @ucdjs/cli

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

A CLI for working with the Unicode Character Database (UCD).

## Installation

```bash
npm install -g @ucdjs/cli
```

## Commands

- `store` for local UCD store setup, sync, verification, and analysis
- `files` for browsing and fetching Unicode data from the API
- `lockfile` for inspecting, validating, and hashing store metadata
- `pipelines` for listing and running pipelines, including the local UI
- `codegen` for generating TypeScript field definitions

## Examples

```bash
ucd store init --store-dir .tmp-store 17.0.0
ucd files list 16.0.0/ucd
ucd pipelines run --ui
```

Run `ucd --help` or `ucd <command> --help` for command-specific flags.

Full CLI docs:

- [docs.ucdjs.dev/packages/cli](https://docs.ucdjs.dev/packages/cli)

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/cli?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/cli
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/cli?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/cli
