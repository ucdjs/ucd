import { describe, expect, it } from "vitest";
import { sourcesEventsRouter, sourcesPipelineRouter } from "../src/server/routes";
import { createTestExecution, createTestRoutesApp } from "./helpers";

describe("pipeline events", () => {
  it("returns events for an execution", async () => {
    const { app } = await createTestRoutesApp(sourcesPipelineRouter, sourcesEventsRouter);
    const executionId = await createTestExecution(app);

    const eventsRes = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/events?limit=10&offset=0`,
    ));

    expect(eventsRes.status).toBe(200);
    const eventsData = await eventsRes.json();
    expect(eventsData.executionId).toBe(executionId);
  });
});
