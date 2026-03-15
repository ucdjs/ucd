# Critique: `apps/api` (`@ucdjs/api`)

## Validation

- `pnpm --dir apps/api run typecheck` -> passed
- `pnpm --dir apps/api run build` -> passed
- `pnpm --dir apps/api run test` -> failed in this sandbox because the worker test setup tried to open a local listener on `127.0.0.1`

## Revised position

The earlier criticism was too broad.

It is reasonable for the API worker to own:

- the public HTTP API
- the OpenAPI document and Scalar UI
- the internal `files()` service-binding RPC reused by Store

Those responsibilities are coherent in [apps/api/src/worker.ts](/Users/luxass/dev/ucdjs/ucd/apps/api/src/worker.ts) and [apps/api/src/index.ts](/Users/luxass/dev/ucdjs/ucd/apps/api/src/index.ts). The RPC method is a narrow internal boundary over [apps/api/src/lib/files.ts](/Users/luxass/dev/ucdjs/ucd/apps/api/src/lib/files.ts), not a random extra concern.

The actual architectural pressure is narrower: the worker mixes the public read plane with privileged task and workflow control-plane behavior.

## Findings

### 1. The real boundary problem is `/_tasks`, not OpenAPI or the internal `files()` RPC

Severity: high

Evidence:

- The public read API, OpenAPI, and well-known routes are all registered in [apps/api/src/worker.ts](/Users/luxass/dev/ucdjs/ucd/apps/api/src/worker.ts).
- The worker entrypoint also exports `ManifestUploadWorkflow` and exposes the `files()` service-binding RPC in [apps/api/src/index.ts](/Users/luxass/dev/ucdjs/ucd/apps/api/src/index.ts).
- The `/_tasks` router in [apps/api/src/routes/tasks/routes.ts](/Users/luxass/dev/ucdjs/ucd/apps/api/src/routes/tasks/routes.ts) performs privileged authentication, accepts TAR uploads, writes directly to R2, starts workflows, exposes workflow status, and purges caches.

Why this is valid criticism:

- Public read traffic and privileged operational traffic are different concerns with different failure modes, auth needs, and observability needs.
- The `files()` RPC is not the messy part. The `/_tasks` upload and workflow orchestration path is.
- That means the worker is not "too broad" in general; it is carrying a specific control-plane surface that muddies the boundary.

What to do:

- Keep the read API, OpenAPI surface, and `files()` RPC in this worker.
- Treat `/_tasks` as the part to isolate.
- Near term: document `/_tasks` explicitly as an operational surface, not as part of the normal public API shape.
- Medium term: move upload, workflow kickoff, status, and cache purge into a dedicated privileged worker or other dedicated ingress path.

### 2. The task upload flow is doing too much in one request boundary

Severity: high

Evidence:

- `POST /_tasks/upload-manifest` in [apps/api/src/routes/tasks/routes.ts](/Users/luxass/dev/ucdjs/ucd/apps/api/src/routes/tasks/routes.ts) validates auth, validates version and content type, reads the full request body, writes a TAR to R2, verifies it with `head()`, starts the workflow, and constructs a status URL.
- The workflow in [apps/api/src/workflows/manifest-upload.ts](/Users/luxass/dev/ucdjs/ucd/apps/api/src/workflows/manifest-upload.ts) then extracts TAR contents, uploads each file to R2, validates them, purges caches, and cleans up the TAR.

Why this is valid criticism:

- The upload route is currently the orchestration gateway for a whole ingestion pipeline.
- That makes the API worker own both read-plane behavior and ingestion/control-plane behavior.
- This is also the part you already called out as the thing that should be redesigned.

What to do:

- Decide what the upload boundary should be:
- Option A: a dedicated task worker that owns auth, upload ingestion, workflow kickoff, and status
- Option B: a narrower API route that only validates and enqueues, with the heavy lifting moved behind that boundary
- If the current route must stay for now, shrink it so it only:
- authenticates
- stores a request artifact
- starts a workflow
- returns an identifier
- Leave cache purge and any secondary operational actions fully inside the workflow/control plane

### 3. The dev and test story should be fixed through explicit boundaries, not through a forced shared lifecycle

Severity: medium

Evidence:

- API has its own `dev:setup` script in [apps/api/package.json](/Users/luxass/dev/ucdjs/ucd/apps/api/package.json).
- Store test infrastructure builds and mounts API as an auxiliary worker in [apps/store/test/global-setup.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/test/global-setup.ts) and [apps/store/vitest.config.ts](/Users/luxass/dev/ucdjs/ucd/apps/store/vitest.config.ts).

Why this is valid criticism:

- The earlier recommendation to use a shared dev lifecycle was too opinionated and does not fit your known constraints.
- The real issue is not "make everything share one lifecycle."
- The real issue is that worker coupling is implicit and awkward in local validation.

What to do:

- Drop the idea of a shared lifecycle.
- Instead, define two explicit validation modes:
- isolated API tests
- explicit API<->Store integration tests
- For Store unit tests, prefer mocking the `UCDJS_API.files` service binding directly.
- Reserve auxiliary-worker setup for dedicated integration coverage so the dependency is visible and intentional.

### 4. The docs still do not explain the read-plane vs control-plane split

Severity: medium

Evidence:

- The worker implementation makes the split obvious in code, but [apps/api/README.md](/Users/luxass/dev/ucdjs/ucd/apps/api/README.md) is mostly operational boilerplate.
- There is no simple subsystem doc showing:
- public read API ownership
- Store-facing `files()` RPC ownership
- `/_tasks` operational ownership
- workflow and R2 interactions

Why this is valid criticism:

- Without that framing, the worker looks "messy" even when some of its roles are legitimate.
- Contributors cannot tell which parts are stable product surface and which parts are operational plumbing.

What to do:

- Add a short architecture note for `apps/api` covering:
- read plane: OpenAPI, versioned routes, well-known routes
- internal seam: `files()` service binding
- control plane: `/_tasks` and workflow ingestion
- Add one sequence diagram for `upload-manifest -> workflow -> R2 -> cache purge`.

## What is good

- The app builds and typechecks cleanly.
- OpenAPI is wired into the runtime, so the HTTP contract is formalized.
- The internal `files()` RPC is a defensible reuse point for Store.
- The route surface is already organized enough that the task/control-plane path can be extracted later without rewriting the whole app.

## Recommended path forward

1. Keep the current read API, OpenAPI surface, and `files()` RPC in `apps/api`.
2. Treat `/_tasks` as the problem area and redesign it separately from the read API.
3. Stop recommending a shared worker lifecycle; make the integration boundary explicit instead.
4. Add docs and diagrams that explain the difference between the public read plane and the privileged control plane.
