import { describe, expect, it } from "vitest";
import { sourcesIndexRouter, sourcesSourceRouter } from "../src/server/routes";
import { createTestRoutesApp } from "./helpers";

describe("sources routes", () => {
  it("lists sources with file and pipeline counts", async () => {
    const { app } = await createTestRoutesApp(sourcesIndexRouter);

    const res = await app.fetch(new Request("http://localhost/api/sources"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "local",
        type: "local",
      }),
    ]));
    expect(data[0]?.fileCount).toBeGreaterThan(0);
    expect(data[0]?.pipelineCount).toBeGreaterThan(0);
  });

  it("returns source files with ids and labels", async () => {
    const { app } = await createTestRoutesApp(sourcesSourceRouter);

    const res = await app.fetch(new Request("http://localhost/api/sources/local"));
    expect(res.status).toBe(200);
    const data = await res.json();

    const fileIds = data.files.map((file: { id: string }) => file.id).sort();
    expect(fileIds).toContain("simple");
    expect(fileIds).toContain("multiple");
    expect(fileIds).toContain("sequence");

    const labels = data.files.map((file: { label: string }) => file.label).sort();
    expect(labels).toContain("simple");
    expect(labels).toContain("multiple");
    expect(labels).toContain("sequence");
  });
});
