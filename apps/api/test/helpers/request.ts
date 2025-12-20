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

  let _json: any;
  let _text: string;

  return {
    response,
    ctx,
    async json() {
      return _json ?? (_json = await response.json());
    },
    async text() {
      return _text ?? (_text = await response.text());
    },
  };
}
