import { describe, expect, it } from "vitest";
import { createTestApp, createTestExecution } from "./helpers";

describe("pipeline events", () => {
  it("returns events for an execution", async () => {
    const { app } = await createTestApp();
    const executionId = await createTestExecution(app);

    const eventsRes = await app.fetch(new Request(
      `/api/pipelines/simple/simple/executions/${executionId}/events?limit=10&offset=0`,
    ));

    expect(eventsRes.status).toBe(200);
    const eventsData = await eventsRes.json();
    expect(eventsData.executionId).toBe(executionId);
  });
});
