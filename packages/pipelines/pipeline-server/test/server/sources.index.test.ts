import { describe, expect, it } from "vitest";
import { sourcesIndexRouter } from "../../src/server/routes";
import { createTestRoutesApp } from "./helpers";

describe("GET /api/sources", () => {
  it("lists sources with labels, counts, and serialized issues", async () => {
    const { app } = await createTestRoutesApp([sourcesIndexRouter], {
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
    const { app } = await createTestRoutesApp([sourcesIndexRouter]);

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
