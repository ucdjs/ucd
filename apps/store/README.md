# @ucdjs/store

`@ucdjs/store` is the storage-facing compatibility HTTP backend for UCD.js.

It exposes a small filesystem-style surface used by store tooling and remote consumers.

## 🚀 Usage

If you are inside the root of the monorepo, run:

```sh
pnpm run dev:apps
```

If you only want to start Store, run:

```sh
pnpm --filter @ucdjs/store dev
```

Store runs on port `8788` in local development by default.

## Routes

- `GET /.ucd-store.lock` returns the store lockfile metadata.
- `GET /:version/snapshot.json` returns snapshot metadata for a Unicode version.
- `GET /:version/:filepath` returns a file from the requested Unicode version.

## 📄 License

Published under [MIT License](./LICENSE).
