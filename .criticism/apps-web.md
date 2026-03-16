# Critique: `apps/web` (`@ucdjs/web`)

## Validation

- `pnpm --dir apps/web run typecheck` -> passed
- `pnpm --dir apps/web run build` -> passed

## Findings

- Parts of the consumer experience are still built on placeholders. [apps/web/src/apis/characters.ts](/Users/luxass/dev/ucdjs/ucd/apps/web/src/apis/characters.ts) and the related block functions in `src/functions` still contain TODOs to replace mocked data with real API calls. That is valid criticism because it means the UI can look more finished than the backing contract really is.
- The app depends directly on [packages/ucd-store](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/package.json) and [packages/shared-ui](/Users/luxass/dev/ucdjs/ucd/packages/shared-ui/package.json), which pulls internal storage and UI complexity directly into the frontend boundary. It works, but it also means the frontend is coupled to some of the messiest packages in the repo.
- There are no app-level tests. For a consumer-facing app, that leaves route behavior, data loading, and search interactions largely unguarded.
- The README in [apps/web/README.md](/Users/luxass/dev/ucdjs/ucd/apps/web/README.md) is generic and does not explain what data is real, what is placeholder, or how the app relates to the API and Store services.
- The app would benefit from diagrams too. A simple consumer-flow diagram from browser -> web app -> API/Store -> upstream data would make the current data model far easier to reason about.

## What is good

- The app builds and typechecks cleanly.
- The route structure is substantial enough that it can become a strong consumer surface once the mocked edges are removed.

## Suggested next moves

1. Stop shipping placeholder data paths as if they were finished product behavior.
2. Add frontend tests around the main search and file exploration flows.
3. Document the actual runtime data flow with a consumer-facing diagram.
