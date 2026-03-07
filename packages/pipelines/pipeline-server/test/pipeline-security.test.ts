import { describe, expect, it } from "vitest";
import { sourcesFileRouter } from "../src/server/routes";
import { createTestRoutesApp } from "./helpers";

describe("pipeline security", () => {
  it("does not resolve unknown file ids", async () => {
    const { app } = await createTestRoutesApp(sourcesFileRouter);

    const res = await app.fetch(new Request("http://localhost/api/sources/local/files/..~secrets~leak"));
    expect(res.status).toBe(404);
  });
});
