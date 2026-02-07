import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers";

describe("pipeline security", () => {
  it("blocks path traversal for local files", async () => {
    const { app } = await createTestApp();

    const res = await app.fetch(new Request("/api/pipelines/..~secrets~leak/simple/code"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
