import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers";

describe("pipeline detail", () => {
  it("returns pipeline details", async () => {
    const { app } = await createTestApp();

    const res = await app.fetch(new Request("http://localhost/api/pipelines/simple/simple"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.pipeline?.id).toBe("simple");
    expect(data.fileLabel).toBe("simple");
  });
});
