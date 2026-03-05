## Plan: Loader-First API Redesign (v1 Locked)

Ship this in clear stages with strict boundaries: Stage 1 normalizes loader error types; Stage 2 redesigns API routes/endpoints; Stage 3 realigns TanStack Query + client routes. Breaking changes are acceptable. Type reuse is mandatory.

**Scope Rules**
1. Complete each stage end-to-end before starting the next.
2. Do not pull work from later stages into earlier stages.
3. Reuse/export existing types before creating new ones.
4. Prefer `Pick`/`Omit`/composition and `z.infer` over duplicate type declarations.

**Stage 1: Pipeline Loader Error Contract**
1. Redefine loader error shape in `packages/pipelines/pipeline-loader/src/types.ts`.
- Add `code` union.
- Add `scope: "file" | "source"`.
- Keep `message`.
- Keep optional `filePath` (required by invariant for `scope: "file"`).
- Keep optional `cause`/`meta` for diagnostics.
2. Implement classification at all loader error creation points in `packages/pipelines/pipeline-loader/src/loader.ts`.
- `DISCOVERY_FAILED`
- `CACHE_MISS`
- `SYNC_FAILED`
- `BUNDLE_FAILED`
- `IMPORT_FAILED`
- `INVALID_EXPORT`
- `UNKNOWN`
3. Export all new error contracts in `packages/pipelines/pipeline-loader/src/index.ts`.
4. Update/add tests in `packages/pipelines/pipeline-loader/test/loader.test.ts`.
- Assert `code` + `scope` are always present.
- Assert `scope: "file"` has `filePath`.
- Assert `UNKNOWN` fallback.
5. Boundary compile-check in `packages/pipelines/pipeline-server/src/server/lib/loader.ts` only (no route redesign in Stage 1).

**Stage 1 Acceptance**
1. `vitest run --project=pipeline-loader` passes.
2. `pnpm run typecheck` passes.
3. No duplicate type declarations introduced.

**Stage 2: API Surface Consolidation**
1. Remove redundant/overlapping endpoints.
2. Ensure one canonical endpoint per resource shape.
3. Remove dedicated index/meta endpoints if data is available via canonical source/file endpoints.
4. Keep response contracts explicit for file errors vs source errors.

**Endpoint Return Contracts (Stage 2)**
1. `GET /api/sources`
- Returns source list only: `id`, `type`, optional lightweight metadata.
2. `GET /api/sources/:sourceId`
- Returns source detail with:
- `sourceId`
- `files[]` with `pipelines` and optional file-scoped `errors`
- `sourceErrors[]` for source-scoped failures
3. `GET /api/sources/:sourceId/:fileId`
- Returns single canonical `file` payload (no duplicated top-level error mirror).
4. `GET /api/sources/:sourceId/:fileId/:pipelineId`
- Returns pipeline detail only.
5. `POST /api/sources/:sourceId/refresh`
- Returns refresh status + optional errors.
6. Execution endpoints
- Evaluate nested vs partially flattened in Stage 2B and pick one canonical pattern.

**Stage 2 Acceptance**
1. Endpoint matrix has no duplicate data paths.
2. Deprecated redundant endpoints are removed.
3. Contract docs/schema updated to match canonical shapes.

**Stage 3: Frontend Query + Route Realignment**
1. Rebuild TanStack Query options around canonical endpoint keys.
2. Ensure cache reuse across source page, file page, sidebar, command palette.
3. Remove query helpers that duplicate endpoint responsibility.
4. Keep UI visually similar unless architecture simplification requires minor UX adjustments.

**Stage 3 Acceptance**
1. Network trace shows reduced duplicate requests.
2. Command palette and route loaders reuse cache instead of re-fetching equivalent data.
3. Typecheck/tests pass with no schema drift.

**Relevant Files by Stage**
1. Stage 1
- `packages/pipelines/pipeline-loader/src/types.ts`
- `packages/pipelines/pipeline-loader/src/loader.ts`
- `packages/pipelines/pipeline-loader/src/index.ts`
- `packages/pipelines/pipeline-loader/test/loader.test.ts`
- `packages/pipelines/pipeline-server/src/server/lib/loader.ts`
2. Stage 2
- `packages/pipelines/pipeline-server/src/server/routes/sources.source.ts`
- `packages/pipelines/pipeline-server/src/server/routes/sources.file.ts`
- `packages/pipelines/pipeline-server/src/server/routes/sources.pipeline.ts`
- `packages/pipelines/pipeline-ui/src/schemas/source.ts`
- `packages/pipelines/pipeline-ui/src/schemas/index.ts`
3. Stage 3
- `packages/pipelines/pipeline-ui/src/functions/sources.ts`
- `packages/pipelines/pipeline-ui/src/functions/index.ts`
- `packages/pipelines/pipeline-ui/src/hooks/use-pipelines.ts`
- `packages/pipelines/pipeline-server/src/client/routes/$sourceId/route.tsx`
- `packages/pipelines/pipeline-server/src/client/routes/$sourceId/$fileId/route.tsx`
- `packages/pipelines/pipeline-server/src/client/routes/__root.tsx`

**Verification Ladder**
1. Stage 1 gate: loader tests + typecheck.
2. Stage 2 gate: curl contract checks for each canonical endpoint.
3. Stage 3 gate: route navigation + cache behavior checks + typecheck.

**Decisions (Locked for v1)**
1. Breaking changes are allowed.
2. `scope` is included in loader errors.
3. Type reuse/export is mandatory; duplicate shape definitions are not acceptable.
4. Finish plan and stage gates first; optimize/refine after baseline is shipped.


**Payload Anti-Duplication Policy (Locked)**
1. Do not return full `pipelines[]` for the same file in multiple endpoints.
2. Keep one canonical endpoint for each heavy payload shape.
3. List/summary endpoints return counts and metadata only.
4. Detail endpoints return full objects.

**Canonical Endpoint Response Structures (Stage 2, explicit)**
1. `GET /api/sources`
- Returns:
- `{ sources: SourceSummaryItem[] }`
- `SourceSummaryItem = { id: string; type: "local" | "github" | "gitlab"; hasErrors: boolean; fileCount: number; pipelineCount: number }`

2. `GET /api/sources/:sourceId`
- Returns:
- `{ sourceId: string; files: SourceFileSummaryItem[]; sourceErrors: LoaderError[] }`
- `SourceFileSummaryItem = { fileId: string; filePath: string; sourceFilePath?: string; fileLabel: string; sourceId: string; pipelineCount: number; hasErrors: boolean; errorCount: number }`
- No `pipelines[]` here.

3. `GET /api/sources/:sourceId/:fileId`
- Returns:
- `{ sourceId: string; fileId: string; file: SourceFileDetailItem; sourceErrors?: LoaderError[] }`
- `SourceFileDetailItem = { fileId: string; filePath: string; sourceFilePath?: string; fileLabel: string; sourceId: string; pipelines: PipelineInfo[]; errors?: LoaderError[] }`
- This is the canonical file-level pipeline payload.

4. `GET /api/sources/:sourceId/:fileId/:pipelineId`
- Returns:
- `{ sourceId: string; fileId: string; pipelineId: string; pipeline: PipelineDetail }`
- `PipelineDetail` includes full route/version/source details.

5. `POST /api/sources/:sourceId/refresh`
- Returns:
- `{ sourceId: string; status: "success" | "failed" | "no-change"; syncedAt: string; errors?: LoaderError[] }`

6. Execution endpoints (final pattern decided in Stage 2B, one canonical shape only)
- Keep either nested or flattened, not both.
- Each execution payload must be single-source-of-truth and not duplicated across list/detail routes.

**Frontend Query Implication (Stage 3)**
1. Source page uses `GET /api/sources/:sourceId` only (summary-level file cards).
2. File page uses `GET /api/sources/:sourceId/:fileId` for canonical full `pipelines[]`.
3. Pipeline page uses `GET /api/sources/:sourceId/:fileId/:pipelineId` only.
4. Command palette should build from cached file-detail queries when available, and lazily fetch missing file-detail queries.
5. Query keys must mirror summary/detail boundaries to prevent duplicate heavy fetches.


**TanStack Query Efficiency Strategy (Locked)**
1. Loader-first data flow
- Route loaders are the primary fetch layer.
- Use `queryClient.ensureQueryData(...)` in loaders for all route-critical data.
- Components should consume `Route.useLoaderData()` first, not re-fetch the same resource.

2. `ensureQueryData` default policy
- Prefer `ensureQueryData` for source/file/pipeline/execution detail routes.
- Avoid suspense-driven query waterfalls for core pages.
- Reason: data is fast, deterministic, and preloaded in loaders; suspense adds unnecessary rendering stalls and complexity.

3. Query key architecture
- One canonical key family per resource and detail level.
- Example key families:
- `['sources']`
- `['sources', sourceId]`
- `['sources', sourceId, 'files', fileId]`
- `['sources', sourceId, 'files', fileId, 'pipelines', pipelineId]`
- No duplicate key families for equivalent payloads.

4. Summary/detail cache boundaries
- Summary endpoints and detail endpoints must have different keys.
- Source summary payload is never used as a fake detail cache entry.
- Detail pages read/write only their canonical detail keys.

5. Refetch/invalidation rules
- Invalidate by resource scope after mutations (refresh/execute), not broad global invalidations.
- Prefer targeted invalidation:
- source refresh -> invalidate `['sources', sourceId]` and related file summary key.
- pipeline execution -> invalidate execution-list key for that pipeline only.

6. No duplicate fetching in components
- Do not call `useQuery` for data already guaranteed by loader `ensureQueryData`.
- Allowed exception: non-route-critical secondary panels (opt-in lazy queries).

7. Command palette data policy
- Build from cached canonical queries first.
- If required data missing, fetch lazily using canonical query options (not ad-hoc endpoint).

8. Suspense policy for this project stage
- Default: no suspense for core route data.
- Keep route rendering fast via loader-preloaded cache + immediate component render.
- Suspense may be used only for non-critical adjunct panels if needed.

**Stage 3 Additions (Query Implementation Checklist)**
1. Audit each route for duplicate loader+component fetches and remove component duplicates.
2. Convert route-critical pages to loader `ensureQueryData` + `Route.useLoaderData`.
3. Re-key all query options to canonical summary/detail boundaries.
4. Add invalidation map per mutation (`refresh source`, `execute pipeline`).
5. Verify with network trace: one fetch per canonical resource transition path.


**Config Endpoint Contract Rule (Locked)**
1. `GET /api/config` is the single canonical source for server-wide shared configuration.
2. Only place cross-cutting config in this endpoint (workspace identity, server metadata, feature flags, version, environment capabilities).
3. Do not duplicate config fields in source/file/pipeline/execution endpoints.
4. Frontend loads config once at root via `ensureQueryData`, then reuses cache everywhere.
5. Mutations or route transitions must not trigger config refetch unless config is explicitly invalidated.
