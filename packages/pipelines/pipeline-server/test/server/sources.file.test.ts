import { sourcesFileRouter } from "#server/routes";
import { describe, expect, it } from "vitest";
import { createTestRoutesApp } from "./helpers";

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId/files/:fileId", () => {
  it("returns file details and pipelines", async () => {
    const { app } = await createTestRoutesApp([sourcesFileRouter]);

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(expect.objectContaining({
      id: "simple",
      path: "simple.ucd-pipeline.ts",
      label: "simple",
      sourceId: "local",
      pipelines: expect.arrayContaining([
        expect.objectContaining({
          id: "simple",
          name: expect.any(String),
          versions: expect.any(Array),
        }),
      ]),
    }));
  });

  it("returns 404 for an unknown source", async () => {
    const { app } = await createTestRoutesApp([sourcesFileRouter]);

    const res = await app.fetch(new Request("http://localhost/api/sources/missing/files/simple"));

    expect(res.status).toBe(404);
  });

  it("returns 404 for an unknown file", async () => {
    const { app } = await createTestRoutesApp([sourcesFileRouter]);

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/missing"));

    expect(res.status).toBe(404);
  });

  it("does not resolve invalid file ids", async () => {
    const { app } = await createTestRoutesApp([sourcesFileRouter]);

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/..~secrets~leak"));

    expect(res.status).toBe(404);
  });
});
