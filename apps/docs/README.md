# @ucdjs/docs

Documentation site for the UCD.js project, built with Fumadocs.

## 🚀 Usage

If you are inside the root of the monorepo, run:

```sh
pnpm run dev:apps
```

If you only wanna start the Docs app, run:

```sh
pnpm --filter @ucdjs/docs dev
```

## 📖 Documentation

The documentation is available at [docs.ucdjs.dev](https://docs.ucdjs.dev).

## 🔧 Development

The project uses:

- [React](https://react.dev/) for the UI
- [Vite](https://vitejs.dev/) for build tooling
- [TanStack Router](https://tanstack.com/router) for routing
- [Fumadocs](https://fumadocs.vercel.app/) for documentation
- [Tailwind CSS](https://tailwindcss.com/) for styling

Mermaid diagrams are rendered to SVG at build time through `rehype-mermaid`, which uses Playwright's
Chromium browser in Node.js. On a new machine, install the Playwright Chromium browser once before
building docs:

```sh
pnpm --filter @ucdjs/docs exec playwright install chromium
```

## 📄 License

Published under [MIT License](./LICENSE).
