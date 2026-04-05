import { sourcesRouter } from "#server/routes";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { createTestApp } from "../_server-helpers";

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources", () => {
  it("lists sources with labels, counts, and serialized issues", async () => {
    const { app } = await createTestApp({
      routers: [sourcesRouter],
      sources: [
        {
          kind: "local",
          id: "local",
          path: "/definitely/missing",
        },
      ],
    });

    const res = await app.fetch(new Request("http://localhost/api/sources"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual([
      expect.objectContaining({
        id: "local",
        type: "local",
        label: "local",
        fileCount: 0,
        pipelineCount: 0,
        errors: expect.arrayContaining([
          expect.objectContaining({
            code: expect.any(String),
            scope: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      }),
    ]);
    expect(data[0].errors[0]).not.toHaveProperty("cause");
  });

  it("lists the default local source with file and pipeline counts", async () => {
    const { app } = await createTestApp({
      routers: [sourcesRouter],
    });

    const res = await app.fetch(new Request("http://localhost/api/sources"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "local",
        type: "local",
        label: "local",
      }),
    ]));
    expect(data[0]?.fileCount).toBeGreaterThan(0);
    expect(data[0]?.pipelineCount).toBeGreaterThan(0);
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId", () => {
  it("returns files with ids, labels, and pipelines", async () => {
    const dir = await testdir({
      "valid.ucd-pipeline.ts": /* ts */`
        export const validPipeline = {
          _type: "pipeline-definition",
          id: "valid",
          name: "Valid Pipeline",
          versions: ["16.0.0"],
          inputs: [{ id: "local" }],
          routes: [{ id: "route-1", filter: "*.txt", outputs: [] }],
        };
      `,
    });

    const { app } = await createTestApp({
      routers: [sourcesRouter],
      sources: [{
        kind: "local",
        id: "test-source",
        path: dir,
      }],
    });

    const res = await app.fetch(new Request("http://localhost/api/sources/test-source"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual({
      id: "test-source",
      type: "local",
      label: "local",
      files: [
        {
          id: "valid",
          path: "valid.ucd-pipeline.ts",
          label: "valid",
          pipelines: [{
            id: "valid",
            name: "Valid Pipeline",
            description: undefined,
            tags: undefined,
            versions: ["16.0.0"],
            routeCount: 1,
            sourceCount: 1,
            sourceId: "local",
          }],
        },
      ],
      errors: [],
    });
  });

  it("strips cause from loader errors in the response", async () => {
    const dir = await testdir({
      "broken.ucd-pipeline.ts": /* ts */`
        import { missing } from "nonexistent-package";
        export const brokenPipeline = missing;
      `,
    });

    const { app } = await createTestApp({
      routers: [sourcesRouter],
      sources: [{
        kind: "local",
        id: "test-source",
        path: dir,
      }],
    });

    const res = await app.fetch(new Request("http://localhost/api/sources/test-source"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.errors.length).toBeGreaterThan(0);
    for (const error of data.errors) {
      expect(error).not.toHaveProperty("cause");
      expect(error).toEqual(expect.objectContaining({
        code: expect.any(String),
        scope: expect.any(String),
        message: expect.any(String),
      }));
    }
  });

  it("returns 404 for an unknown source", async () => {
    const { app } = await createTestApp({
      routers: [sourcesRouter],
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
