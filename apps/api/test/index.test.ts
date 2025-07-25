import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from "cloudflare:test";
import { expect, it } from "vitest";
import worker from "../src";

it("respond with a 404", async () => {
  const request = new Request("https://api.ucdjs.dev/not-found");
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({
    message: "Not Found",
    status: 404,
    timestamp: expect.any(String),
  });
});
