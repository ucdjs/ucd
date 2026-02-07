# Pipeline Server Refactor Plan

## Goals
- Replace file-id derivation with a secure, readable scheme based on full relative path segments, joined by `~`.
- Strip `.ucd-pipeline.ts` and `.ts` from file IDs (configurable suffix list).
- Extract helper logic from `src/server/routes/pipelines.ts` into `src/server/lib/pipelines/`.
- Split API routes into smaller files with coherent concerns.
- Improve frontend layout and file display post-migration.
- Add H3 fetch-based tests for key API routes.

## Progress
- [ ] Create helper modules under `src/server/lib/pipelines/`.
- [ ] Split and update server routes.
- [ ] Update API response shapes with `fileLabel`.
- [ ] Update pipeline-ui types and sidebar display.
- [ ] Update pipeline-server client UI and layout.
- [ ] Add H3 fetch tests in `packages/pipelines/pipeline-server/test`.

---

## 1) File ID & Path Helpers

### New module: `src/server/lib/pipelines/ids.ts`
- `PIPELINE_FILE_SUFFIXES = [".ucd-pipeline.ts", ".ts"]`
- `stripSuffixes(fileName, suffixes)`
- `sanitizeSegment(segment)`:
  - replace `~` with `-`
  - replace whitespace with `-`
- `fileIdFromPath(filePath)`:
  - normalize path
  - split segments
  - strip suffixes from final segment
  - join segments with `~`
- `fileLabelFromPath(filePath)`:
  - readable display label, e.g. `pipelines/api/foo`

### New module: `src/server/lib/pipelines/resolve.ts`
- `resolveLocalFilePath(cwd, filePath)`:
  - `resolved = path.resolve(cwd, filePath)`
  - `relative = path.relative(cwd, resolved)`
  - if `relative.startsWith("..")` or `path.isAbsolute(relative)` -> throw error
  - ensures traversal prevention

### New module: `src/server/lib/pipelines/files.ts`
- Move:
  - `FilePipelineEntry`
  - `PipelineFileGroup`
  - `buildFileGroups`
  - `applySearchFilter`
  - `findFileGroup`
  - `findPipelineByFileId`
- Update file groups to include `fileLabel` from `fileLabelFromPath`.

### New module: `src/server/lib/pipelines/loader.ts`
- Move `getPipelines` from `src/server/lib.ts`.

---

## 2) Server Routes Split

### `src/server/routes/pipelines/index.ts`
- `GET /api/pipelines`
- Uses `getPipelines` + `buildFileGroups` + `applySearchFilter`
- Response includes: `fileId`, `filePath`, `fileLabel`, `sourceId`, `pipelines`

### `src/server/routes/pipelines/file.ts`
- `GET /api/pipelines/:file`
- Looks up a file by `fileId`, returns `fileId`, `filePath`, `fileLabel`, `sourceId`, `pipelines`

### `src/server/routes/pipelines/pipeline.ts`
- `GET /api/pipelines/:file/:id`
- `GET /api/pipelines/:file/:id/code`
- Use shared helpers and `resolveLocalFilePath` for local file reads

### `src/server/routes/pipelines/execution.ts`
- `POST /api/pipelines/:file/:id/execute`
- `GET /api/pipelines/:file/:id/executions`
- Reuse helper logic and avoid duplicating source scanning

### `src/server/routes/pipelines.ts`
- Mounts above route files under `/api/pipelines`

---

## 3) API Shape Changes

### Add `fileLabel` everywhere files are referenced:
- `PipelinesResponse.files[]`
- `PipelineFileResponse.file`
- `PipelineResponse` (optional `fileLabel` for convenience)

`filePath` stays for display only; never used for routing.

---

## 4) Frontend Updates

### `packages/pipelines/pipeline-server` client
- Update fetch paths to use the new `fileId`.
- Use `fileLabel` as primary display, show `filePath` in muted text.
- Improve layout in:
  - `src/client/routes/pipelines/$file/index.tsx`
  - `src/client/components/pipeline-command-palette.tsx`
  - Optional: breadcrumb or label in `src/client/components/pipeline-header.tsx`

### `packages/pipelines/pipeline-ui`
- Update types: add `fileLabel?: string` in `PipelineFileInfo`
- Update sidebar display to use `fileLabel` instead of `filePath.split`

---

## 5) Tests (H3 fetch)

### Test approach
- Use `vitest` + `h3` app `.fetch` to call API routes.
- For routes needing filesystem context, use `vitest-testdirs`:
  ```ts
  import { testdir } from "vitest-testdirs";
  const storePath = await testdir({
    "UnicodeData.txt": content,
  });
  ```

### Proposed tests
1) `GET /api/pipelines` returns files with `fileId` using `~` separator and no `.ts` suffix
2) `GET /api/pipelines/:file` finds file by new `fileId`
3) `GET /api/pipelines/:file/:id` returns pipeline details
4) `GET /api/pipelines/:file/:id/code` returns definePipeline snippet
5) `POST /api/pipelines/:file/:id/execute` returns execution id and status
6) `GET /api/pipelines/:file/:id/executions` lists executions
7) Local path traversal is blocked (attempt `../` path should fail)

### Test location
- `packages/pipelines/pipeline-server/test/pipelines.test.ts`

---

## 6) Execution Order

1. Create helper modules under `src/server/lib/pipelines/`.
2. Move `getPipelines` into `loader.ts`.
3. Split and update server routes.
4. Update API response shape to include `fileLabel`.
5. Update pipeline-ui types and sidebar.
6. Update pipeline-server client UI and layout.
7. Add H3 fetch tests with `testdir` where needed.

---

## Notes & Constraints

- No backward compat needed.
- Tanstack type errors: if Link/useParams type complaints appear, report and stop (no casts).
- Avoid tiny re-export files; keep modules meaningful.
