# Critique: `apps/store` (`@ucdjs/store`)

## Validation

- `pnpm --dir apps/store run typecheck` -> passed
- `pnpm --dir apps/store run build` -> worker bundle was produced, but Wrangler exited with sandbox-related `EPERM` while trying to write logs under `~/.config/.wrangler/logs`
- `pnpm exec vitest run --project=store` -> failed in this sandbox because the Cloudflare/Vitest worker test setup tried to write Wrangler logs and open a local listener on `127.0.0.1`

The app is not obviously broken in source form. The valid criticism is that its contract, workflow, and architecture are much weaker than the small code surface makes them look.

## Scores

- Consumer contract honesty: `2/10`
- Boundary clarity: `3/10`
- Dev workflow quality: `2/10`
- Documentation accuracy: `2/10`
- Runtime/test confidence: `4/10`

## Findings

### 1. The Store app is mostly a projection over the API worker, not a strong subsystem of its own

Severity: high

Evidence:

- The files route simply forwards to the API service binding in [apps/store/src/routes/files.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/files.ts#L10).
- The worker is wired directly to the `UCDJS_API` service in [apps/store/wrangler.jsonc](/Users/luxass/dev/ucdjs/ucd/apps/store/wrangler.jsonc#L24).
- The root handler describes a filesystem-style API, but the real file-serving logic is delegated out in [apps/store/src/worker.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/worker.ts#L17).

Why this is valid criticism:

- This app looks like a storage service, but its most important route is just an adapter over another worker.
- That makes the boundary muddy: consumers cannot tell what Store actually owns versus what API owns.
- It also reinforces the repo-wide mess you called out. `ucd-store`, Store API, and API worker are overlapping instead of forming a clean stack.

Recommendation:

- Decide whether Store is a true storage/product boundary or just a compatibility facade.
- If it is a facade, document it that way and shrink the surface.
- If it is a real subsystem, move more of the ownership here instead of tunneling through API.

### 2. The app returns placeholder integrity data in public responses

Severity: high

Evidence:

- Snapshot generation uses a hardcoded zero hash in [apps/store/src/routes/snapshot.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/snapshot.ts#L8).
- Snapshot file sizes are hardcoded to `0` in [apps/store/src/routes/snapshot.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/snapshot.ts#L39).
- Lockfile entries hardcode `totalSize: 0` in [apps/store/src/routes/lockfile.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/lockfile.ts#L39).

Why this is valid criticism:

- This is not just unfinished internals. It means the public API is claiming to provide integrity/state metadata while knowingly returning placeholders.
- Consumers cannot safely rely on hashes or size metadata yet, but the response shape implies they can.
- That is a contract honesty problem.

Recommendation:

- Either compute real metadata or explicitly version the response as partial/unstable.
- Do not present placeholder hashes and zero sizes as if they were meaningful data.

### 3. The Store dev and test workflow is coupled to the API worker in a brittle way

Severity: high

Evidence:

- Store tests build the API worker in global setup by shelling into `../api` in [apps/store/test/global-setup.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/test/global-setup.ts#L4).
- The Vitest config then mounts that built worker as an auxiliary worker from `../api/dist/index.js` in [apps/store/vitest.config.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/vitest.config.ts#L24).
- The files route test explicitly notes that the API worker runs in a separate thread and cannot be mocked normally in [apps/store/test/routes/files.test.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/test/routes/files.test.ts#L6).

Why this is valid criticism:

- This matches your complaint exactly: the worker setup is not composed cleanly, and Store depends on API-specific dev machinery just to test itself.
- The app cannot be reasoned about or validated in isolation.
- When the test harness itself needs cross-worker build choreography, contributor DX is already in trouble.

Recommendation:

- Replace the current cross-build test harness with a narrower contract test boundary.
- Treat API integration as explicit integration coverage, not as a hidden prerequisite of normal Store tests.

### 4. The README is materially wrong about how to run the app

Severity: medium

Evidence:

- The README says “If you only wanna start the API app, run `pnpm --filter @ucdjs/api dev`” in [apps/store/README.md](/Users/luxass/dev/ucdjs/ucd/apps/store/README.md#L12).
- It points readers to `api.ucdjs.dev` for API documentation in [apps/store/README.md](/Users/luxass/dev/ucdjs/ucd/apps/store/README.md#L18).

Why this is valid criticism:

- This is not a minor typo. It tells Store contributors to start the wrong app.
- It strongly suggests the app was cloned from API scaffolding and never fully given its own operational documentation.
- That is exactly the kind of thing that makes a subsystem feel unfinished.

Recommendation:

- Rewrite the README so it actually documents Store:
- local dev command
- how it depends on API today
- the route model
- what is stable versus placeholder

### 5. The app is duplicating storage metadata reconstruction instead of serving canonical data

Severity: medium

Evidence:

- Lockfile generation scans R2 manifests and reconstructs version metadata on the fly in [apps/store/src/routes/lockfile.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/lockfile.ts#L19).
- Snapshot generation also reconstructs file entries from `expectedFiles` in [apps/store/src/routes/snapshot.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/routes/snapshot.ts#L31).

Why this is valid criticism:

- Store is deriving public API responses from partial manifest data rather than serving canonical stored metadata.
- That is why hashes and sizes are placeholders: the source of truth is not modeled properly.
- It turns the app into a translation layer over incomplete state instead of a trustworthy storage index.

Recommendation:

- Make manifest/state data first-class and complete enough for the public contract.
- Stop reconstructing richer public responses from thinner internal artifacts if the internal artifacts cannot support them.

### 6. The public service metadata is hardcoded and already drifting

Severity: medium

Evidence:

- The root route hardcodes `version: "1.0.0"` in [apps/store/src/worker.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/src/worker.ts#L22), while the package manifest is not pinned there and the app is private in [apps/store/package.json](/Users/luxass/dev/ucdjs/ucd/apps/store/package.json#L1).

Why this is valid criticism:

- Hardcoded service metadata is a small symptom of a larger problem: the app is presenting itself like a productized API, but parts of the contract are still manual placeholders.
- Those details drift quickly and reduce trust.

Recommendation:

- Generate or inject service metadata from one source of truth.
- Avoid hand-maintained version markers in worker responses.

### 7. The docs explain the package layer, but not the app boundary that consumers actually hit

Severity: medium

Evidence:

- The architecture docs describe `@ucdjs/ucd-store` in [apps/docs/content/architecture/ucd-store.mdx](/Users/luxass/dev/ucdjs/ucd/apps/docs/content/architecture/ucd-store.mdx#L1).
- There is no equivalent doc page explaining `@ucdjs/store` as a deployed worker boundary, its dependency on `UCDJS_API`, or how `.ucd-store.lock` and `snapshot.json` are derived.

Why this is valid criticism:

- Right now the repo documents the library abstraction more than the deployed service boundary.
- That is backwards for consumer understanding, because the app is the thing returning the public responses.

Recommendation:

- Add Store app documentation that explains:
- service ownership
- route derivation
- API-worker dependency
- what metadata is authoritative today

### 8. The app is missing diagrams, and this subsystem clearly needs them

Severity: medium

Evidence:

- There is no diagram showing Store between `ucd-store`, `fs-bridge`, API worker, R2 manifests, and external consumers.
- There is no sequence diagram showing how `/.ucd-store.lock`, `/:version/snapshot.json`, and `/:version/:filepath` are fulfilled.

Why this is valid criticism:

- This app is deceptively small. Without a diagram, it is easy to miss that each route has different ownership and data provenance.
- That confusion is already visible in the code and README drift.

Recommendation:

- Add at least two diagrams:
- a dependency/ownership diagram for Store vs API vs R2
- a sequence diagram for lockfile, snapshot, and file fetch flows

## What is good

- The route surface is small enough that redesign is still cheap.
- The path utility tests in [apps/store/test/unit/path-utils.test.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/test/unit/path-utils.test.ts#L1) are specific and useful.
- The app does have direct route tests instead of relying only on manual worker testing.

## Suggested next moves

1. Decide whether Store is a real storage boundary or an adapter over API.
2. Stop returning placeholder hashes and sizes in stable-looking response shapes.
3. Decouple normal Store validation from building and mounting the API worker.
4. Rewrite the README and add app-level docs plus diagrams.
5. Review `packages/fs-bridge` next, because the abstraction pressure is clearly leaking upward into both Store and `ucd-store`.
