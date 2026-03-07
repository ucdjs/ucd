import { describe, expect, it } from "vitest";
import { sourcesPipelineRouter } from "../src/server/routes";
import { createTestRoutesApp } from "./helpers";

describe("pipeline code", () => {
  it("returns the pipeline detail payload", async () => {
    const { app } = await createTestRoutesApp(sourcesPipelineRouter);

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/simple"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data).toMatchSnapshot();
    expect(Object.keys(data)).toEqual(["pipeline"]);
  });
});
