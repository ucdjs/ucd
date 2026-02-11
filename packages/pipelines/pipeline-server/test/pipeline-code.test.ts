import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers";

describe("pipeline code", () => {
  it("returns code for pipeline", async () => {
    const { app } = await createTestApp();

    const res = await app.fetch(new Request("http://localhost/api/pipelines/simple/simple/code"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.code).toMatchSnapshot();
    expect(data.fileLabel).toBe("simple");
  });
});
