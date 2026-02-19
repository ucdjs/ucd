# UCD.js

## Project overview

UCD.js is a monorepo that provides tools and APIs for working with Unicode Character Database (UCD) files.

## Project architecture

- **Monorepo** with JavaScript apps (`apps/`) and JavaScript packages (`packages/`)
  > The monorepo is managed with pnpm workspaces and Turborepo for efficient builds and dependency management.
  > The following structure is a high-level overview.
  > ```
  > packages/ - core libraries published to npm
  > apps/ - applications (API worker, store, web, docs)
  > tooling/ - internal development tools (eslint-plugin, tsconfig, tsdown-config, moonbeam)
  > vscode/ - VS Code extension
  > ```

- See [Project Architecture](apps/docs/content/docs/contribute/development/project.md) for details

## Setup

- **Node.js**: >= 24.13
- **pnpm**: Version in `package.json`
- Run `pnpm install` to install

## Building

- `pnpm run build` - Build JavaScript/TypeScript packages
- `pnpm run build:apps` - Build all apps
- `pnpm run build:vscode` - Build VS Code extension
- `turbo run build --filter "@ucdjs/<package>"` - Build specific package
  > [!IMPORTANT]
  > Do not run "pnpm run build --filter <package>" for individual packages. Always run builds from the repo root and use the turbo filter to specify packages if needed.

## Testing

- `pnpm run test` - Run all tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:ui` - Run tests with UI
- `vitest run --project=<project>` - Run tests for specific project (from repo root)
  > [!NOTE]
  > The project name is taken from the folder name in `packages/` or `apps/`.

> [!NOTE]
> By default we are outputting coverage reports.

## Code quality

- **Linting**: `pnpm run lint`
- **Type checking**: `pnpm run typecheck`

## Common tasks

### Adding a new feature

1. Implement in the appropriate package/app.
2. Add tests for new functionality.
3. Update docs when public APIs change.
4. Run relevant linters/tests for the scope you touched.

### Modifying code

- **Packages**: run `pnpm dev` for package watch mode and test with `vitest run --project=<project>`.
- **Apps**: run `pnpm dev:apps` for app dev servers when needed.
- **CLI**: run from repo root with `./packages/cli/bin/ucd.js <command>` so workspace sources are used.

### Adding tests

- Use `#test-utils/*` and `mockFetch` for reusable test helpers and HTTP mocking.
- Prefer shared helpers when tests are reused across packages.
- See .agents/COMMON_PATTERNS.md for test placement guidance.

## Dependency management

- **Package manager**: pnpm workspaces
- **Catalogs**: dependency versions are centralized in pnpm-workspace.yaml
- **Workspace deps**: use workspace:* for internal packages


## Documentation

- https://docs.ucdjs.dev
- apps/docs (source for the docs site)

## Pull request guidelines

- **Template**: Use `.github/PULL_REQUEST_TEMPLATE.md`
- **Title prefix**: `test:`, `fix:`, `feat:`, `refactor:`, `chore:`
- **Semver alignment**:
  - `fix:` -> PATCH bump
  - `feat:` -> MINOR bump
  - Any breaking change -> MAJOR bump (`type(scope)!:` and/or `BREAKING CHANGE:` in commit body)
- **CI**: All checks must pass

## Contributing

- Follow existing code patterns
- Add tests for new features
- Update docs when APIs change
- Run linters before submitting
- Use Conventional Commits in semver style: `type(scope): subject`
- Prefer these types for release impact: `fix`, `feat`; use `!` or `BREAKING CHANGE:` only for incompatible changes
- Keep PRs focused (one feature/fix per PR)

## Finding code

- **Storage**: `packages/ucd-store/`, `packages/fs-bridge/`, `packages/lockfile/`
- **Pipelines**: `packages/pipelines/`
- **CLI**: `packages/cli/`
- **API**: `apps/api/`
- **Store app**: `apps/store/`
- **Web app**: `apps/web/`
- **Docs**: `apps/docs/`
- **Tests**: `apps/api/test/`, `packages/*/test/`

## AI-Friendly Documentation

This project includes focused documentation for agents. All AI-friendly documentation is located in the `.agents/` directory:

- **[Architecture Guide](.agents/ARCHITECTURE.md)** - System overview, core components, and data flow
- **[API Design](.agents/API_DESIGN.md)** - API and store design rules, versioning, and OpenAPI workflow
- **[Code Style](.agents/CODE_STYLE.md)** - Coding conventions, linting, and formatting expectations
- **[Common Patterns](.agents/COMMON_PATTERNS.md)** - Testing helpers, pipeline patterns, and CLI workflows
- **[Glossary](.agents/GLOSSARY.md)** - Terms and concepts used across the codebase
- **[Skills](.agents/SKILLS.md)** - Expected skills and domain knowledge

## Resources

- [Project Architecture](apps/docs/content/docs/contribute/development/project.md)
