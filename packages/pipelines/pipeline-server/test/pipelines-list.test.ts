import { describe, expect, it } from "vitest";
import { createTestApp } from "./helpers";

describe("pipelines list", () => {
  it("lists pipelines with fileId and fileLabel", async () => {
    const { app } = await createTestApp();

    const res = await app.fetch(new Request("/api/pipelines"));
    expect(res.status).toBe(200);
    const data = await res.json();

    const fileIds = data.files.map((file: { fileId: string }) => file.fileId).sort();
    expect(fileIds).toContain("simple");
    expect(fileIds).toContain("multiple");
    expect(fileIds).toContain("sequence");

    const labels = data.files.map((file: { fileLabel: string }) => file.fileLabel).sort();
    expect(labels).toContain("simple");
    expect(labels).toContain("multiple");
    expect(labels).toContain("sequence");
  });

  it("returns pipeline file data by file id", async () => {
    const { app } = await createTestApp();

    const res = await app.fetch(new Request("/api/pipelines/simple"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.file.fileId).toBe("simple");
    expect(data.file.fileLabel).toBe("simple");
    expect(data.file.pipelines.length).toBeGreaterThan(0);
  });
});
