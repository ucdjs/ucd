import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestRoutesApp } from "./helpers";

const { resolveSourceFilesMock, toPipelineInfoMock, sourceLabelMock } = vi.hoisted(() => ({
  resolveSourceFilesMock: vi.fn(),
  toPipelineInfoMock: vi.fn(),
  sourceLabelMock: vi.fn(),
}));

vi.mock("#server/lib/resolve", () => ({
  resolveSourceFiles: resolveSourceFilesMock,
  sourceLabel: sourceLabelMock,
}));

vi.mock("#shared/lib/pipeline-utils", () => ({
  toPipelineInfo: toPipelineInfoMock,
}));

const { sourcesSourceRouter } = await import("#server/routes/sources.source");

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId", () => {
  beforeEach(() => {
    resolveSourceFilesMock.mockReset();
    toPipelineInfoMock.mockReset();
    sourceLabelMock.mockReset();

    resolveSourceFilesMock.mockResolvedValue({
      files: [{
        id: "simple",
        relativePath: "simple.ucd-pipeline.ts",
        label: "simple",
        pipelines: [{ id: "simple-definition" }],
      }],
      issues: [{
        code: "IMPORT_FAILED",
        scope: "import",
        message: "Import failed",
        cause: new Error("boom"),
      }],
    });
    toPipelineInfoMock.mockReturnValue({
      id: "simple",
      name: "Simple",
      versions: ["16.0.0"],
      routeCount: 1,
      sourceCount: 1,
      sourceId: "local",
    });
    sourceLabelMock.mockReturnValue("local");
  });

  it("returns files with ids and labels", async () => {
    const { app } = await createTestRoutesApp([sourcesSourceRouter], {
      sources: [{
        kind: "local",
        id: "local",
        path: "/tmp/local-source",
      }],
    });

    const res = await app.fetch(new Request("http://localhost/api/sources/local"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(expect.objectContaining({
      id: "local",
      type: "local",
      files: expect.arrayContaining([
        expect.objectContaining({
          id: "simple",
          path: "simple.ucd-pipeline.ts",
          label: "simple",
          pipelines: expect.arrayContaining([
            expect.objectContaining({
              id: "simple",
              versions: expect.any(Array),
            }),
          ]),
        }),
      ]),
      errors: expect.arrayContaining([
        expect.objectContaining({
          code: expect.any(String),
          scope: expect.any(String),
          message: expect.any(String),
        }),
      ]),
    }));
  });

  it("returns 404 for an unknown source", async () => {
    const { app } = await createTestRoutesApp([sourcesSourceRouter], {
      sources: [{
        kind: "local",
        id: "local",
        path: "/tmp/local-source",
      }],
    });

    const res = await app.fetch(new Request("http://localhost/api/sources/missing"));

    expect(res.status).toBe(404);
  });
});
