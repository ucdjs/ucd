import { describe, expect, it } from "vitest";
import { sourcesPipelineRouter } from "../src/server/routes";
import { createTestRoutesApp } from "./helpers";

describe("pipeline detail", () => {
  it("returns pipeline details", async () => {
    const { app } = await createTestRoutesApp(sourcesPipelineRouter);

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/simple/pipelines/simple"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.pipeline?.id).toBe("simple");
    expect(Object.keys(data)).toEqual(["pipeline"]);
  });
});
