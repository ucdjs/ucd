# Critique: `apps/store` (`@ucdjs/store`)

## Validation

- `pnpm --dir apps/store run typecheck` -> passed
- `pnpm --dir apps/store run build` -> worker bundle was produced, but Wrangler exited with sandbox-related `EPERM` while trying to write logs under `~/.config/.wrangler/logs`
- `pnpm exec vitest run --project=store` -> failed in this sandbox because the Cloudflare/Vitest worker test setup tried to write Wrangler logs and open a local listener on `127.0.0.1`

## Revised position

The earlier criticism understated what Store actually is.

Store is not just an arbitrary projection over API. In this repo, it is intended to be the public compatibility HTTP backend for the storage layer, especially for `@ucdjs/fs-backend` and `@ucdjs/ucd-store`. That is consistent with:

- the architecture docs in [apps/docs/content/contributing/development/project.mdx](/Users/luxass/dev/ucdjs/ucd/apps/docs/content/contributing/development/project.mdx)
- the glossary note in [.agents/GLOSSARY.md](/Users/luxass/dev/ucdjs/ucd/.agents/GLOSSARY.md)
- the HTTP backend behavior in [packages/fs-backend/src/backends/http.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-backend/src/backends/http.ts)

The real issue is not "Store has no identity." The real issue is that Store is a hybrid boundary with split ownership:

- file reads are delegated to API today
- store metadata is served locally from R2 manifest data

That can be a valid design, but it needs to be honest, documented, and backed by complete metadata.

## Findings

### 1. Store is a real compatibility boundary, but its ownership split is under-documented

Severity: high

Evidence:

- The app presents itself as a filesystem-style API in [apps/store/src/worker.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/worker.ts).
- The HTTP files route delegates to `UCDJS_API.files` in [apps/store/src/routes/files.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/files.ts).
- Lockfile and snapshot routes are owned locally in [apps/store/src/routes/lockfile.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/lockfile.ts) and [apps/store/src/routes/snapshot.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/snapshot.ts).
- The Store worker is wired to the API worker through a service binding in [apps/store/wrangler.jsonc](/Users/luxass/dev/ucdjs/ucd/apps/store/wrangler.jsonc).

Why this is valid criticism:

- Store does have a legitimate role: it is the stable HTTP access path that storage-facing tooling can target.
- But the app has split ownership internally, and that split is not explained clearly.
- Without that explanation, it is hard to tell whether Store is meant to become fully storage-owned later or remain a compatibility facade over API for file reads.

What to do:

- Update the docs and README to describe Store as a hybrid compatibility boundary.
- Be explicit that:
- `/:version/:filepath` is API-backed today
- `/.ucd-store.lock` and `/:version/snapshot.json` are Store-owned metadata routes
- Decide the target state:
- either Store remains a stable compatibility facade that delegates file reads by design
- or Store gradually takes direct ownership of file reads from canonical storage

### 2. The metadata contract is the most urgent correctness problem

Severity: high

Evidence:

- Snapshot generation uses a placeholder zero hash and `size: 0` in [apps/store/src/routes/snapshot.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/snapshot.ts).
- Lockfile entries hardcode `totalSize: 0` in [apps/store/src/routes/lockfile.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/lockfile.ts).

Why this is valid criticism:

- This is the weakest part of the current Store contract.
- Store is supposed to be the compatibility access point for `fs-backend` and storage-facing consumers, so its metadata needs to be trustworthy.
- Returning stable-looking integrity metadata with placeholders makes the contract look more complete than it is.

What to do:

- Pick one of these paths and implement it explicitly:
- enrich the manifest written to R2 so it contains real hashes and sizes
- compute hashes and sizes during ingestion and persist them as canonical metadata
- mark these responses as partial/unstable until real metadata exists
- The best fix is to make ingestion produce canonical manifest metadata once, then have Store serve that directly.

### 3. Store validation is still too coupled to API internals

Severity: medium

Evidence:

- Store tests build API in [apps/store/test/global-setup.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/test/global-setup.ts).
- Store Vitest mounts the built API worker as an auxiliary worker in [apps/store/vitest.config.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/vitest.config.ts).
- The route test comments already acknowledge the awkwardness in [apps/store/test/routes/files.test.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/test/routes/files.test.ts).

Why this is valid criticism:

- The issue is not that Store depends on API. That dependency may be valid.
- The issue is that the dependency leaks into normal validation in a way that is brittle and hard to reason about.
- This makes it harder to separate "Store route contract works" from "cross-worker integration works."

What to do:

- Split validation into:
- unit tests for Store route behavior with a mocked `UCDJS_API` binding
- explicit integration tests that mount API as an auxiliary worker
- conformance tests that exercise `@ucdjs/fs-backend` and `@ucdjs/ucd-store` against a real Store worker surface
- Treat the auxiliary-worker setup as integration coverage, not as the default shape of Store validation.
- Add contract-level assertions for the things Store exists to guarantee:
- file reads behave the way the HTTP backend expects
- directory listings match the shapes and semantics expected by `@ucdjs/fs-backend`
- lockfile and snapshot routes satisfy the metadata assumptions made by `@ucdjs/ucd-store`

### 4. Service metadata and public messaging should reflect the real state of the app

Severity: medium

Evidence:

- The root route in [apps/store/src/worker.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/worker.ts) hardcodes `version: "1.0.0"`.
- The same route describes Store as a filesystem-style interface without mentioning the API-backed file path.

Why this is valid criticism:

- Hardcoded service versioning is a smaller issue than the placeholder metadata, but it signals the same thing: the public contract is partly hand-maintained.
- The root response is also a good place to make the ownership split more obvious.

What to do:

- Source the service version from one place instead of hardcoding it.
- Adjust the root description so it reflects the real hybrid model.
- If you want to keep the response minimal, at least avoid implying that everything is served directly by Store.

### 5. The app needs an explicit target architecture for file ownership

Severity: medium

Evidence:

- Store file reads currently go through API in [apps/store/src/routes/files.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/files.ts).
- The architecture docs say Store provides access "via the storage layer" in [apps/docs/content/contributing/development/project.mdx](/Users/luxass/dev/ucdjs/ucd/apps/docs/content/contributing/development/project.mdx), which is directionally true but incomplete given the current delegation path.

Why this is valid criticism:

- The current implementation can be defended as a compatibility layer.
- What is unclear is whether that is the intended end state or just a transitional implementation.
- That uncertainty makes it harder to design `ucd-store`, `fs-backend`, and Store cleanly.

What to do:

- Write down the intended end state:
- "Store permanently delegates file reads to API"
- or "Store will eventually serve files directly from canonical storage"
- Then align docs, tests, and route contracts around that decision.

### 6. Store needs explicit conformance coverage as a product boundary

Severity: medium

Evidence:

- Store is described as the public compatibility HTTP backend for the storage layer, but its current tests focus mostly on route-local behavior in [apps/store/test/routes](/Users/luxass/dev/ucdjs/ucd/apps/store/test/routes).
- The HTTP backend in [packages/fs-backend/src/backends/http.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-backend/src/backends/http.ts) and the storage behavior in `@ucdjs/ucd-store` depend on Store semantics, not just on individual JSON payloads.

Why this is valid criticism:

- If Store is a compatibility boundary, then route tests alone are not enough.
- The real question is whether Store behaves correctly when consumed through the abstractions it exists to support.
- Without that coverage, it is easy for Store, `fs-backend`, and `ucd-store` to drift while each still appears locally correct.

What to do:

- Add conformance-style tests that run the HTTP backend against a Store worker instance.
- Add `@ucdjs/ucd-store` integration coverage against the Store surface for:
- reading files
- listing directories
- discovering versions
- consuming lockfile and snapshot metadata
- Treat those tests as the compatibility contract for the Store worker, not as optional downstream tests.

## What is good

- Store does have a real role in the architecture as the public storage-facing HTTP boundary.
- The route surface is still small, so the architecture can be tightened without a large rewrite.
- The current split between metadata routes and file routes is visible enough to improve systematically.
- The path utility tests in [apps/store/test/unit/path-utils.test.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/test/unit/path-utils.test.ts) are useful and specific.

## Recommended path forward

1. Reframe Store publicly as the compatibility HTTP backend for `fs-backend` and `ucd-store`.
2. Fix metadata correctness first by making ingestion produce canonical hashes and sizes.
3. Make the API dependency explicit in docs and isolate it in integration tests instead of hiding it in the default test path.
4. Add conformance coverage between Store and the `fs-backend` / `ucd-store` consumers it exists to support.
5. Decide whether delegated file reads are the long-term design or a transitional implementation.
6. Keep the app docs aligned with the actual boundary so contributors do not have to reverse-engineer it from the code.
