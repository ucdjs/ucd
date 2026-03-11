import { sourcesSourceRouter } from "#server/routes";
import { describe, expect, it } from "vitest";
import { createTestRoutesApp } from "./helpers";

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId", () => {
  it("returns files with ids and labels", async () => {
    const { app } = await createTestRoutesApp([sourcesSourceRouter]);

    const res = await app.fetch(new Request("http://localhost/api/sources/local"));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(expect.objectContaining({
      id: "local",
      type: "local",
      files: expect.arrayContaining([
        expect.objectContaining({ id: "simple", path: "simple.ucd-pipeline.ts", label: "simple" }),
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
    const { app } = await createTestRoutesApp([sourcesSourceRouter]);

    const res = await app.fetch(new Request("http://localhost/api/sources/missing"));

    expect(res.status).toBe(404);
  });
});
