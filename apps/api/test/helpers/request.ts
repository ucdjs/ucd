import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import worker from "../../src/worker";

export interface ExecuteRequestOptions {
  waitForExecutionContext?: boolean;
}

export interface ExecuteRequestResult {
  response: Response;
  ctx: ReturnType<typeof createExecutionContext>;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

export async function executeRequest(
  request: Request,
  env: any,
  options?: ExecuteRequestOptions,
): Promise<ExecuteRequestResult> {
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);

  if (options?.waitForExecutionContext !== false) {
    await waitOnExecutionContext(ctx);
  }

  return {
    response,
    ctx,
    async json() {
      return response.json();
    },
    async text() {
      return response.text();
    },
  };
}

