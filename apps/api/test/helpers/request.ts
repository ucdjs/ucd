import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import worker from "../../src/worker";

export interface ExecuteRequestOptions {
  waitForExecutionContext?: boolean;
}

export interface ExecuteRequestResult {
  response: Response;
  ctx: ReturnType<typeof createExecutionContext>;
  json: <T = unknown>() => Promise<T>;
  text: () => Promise<string>;
}

export async function executeRequest(
  request: Request,
  env: Cloudflare.Env,
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
    async json<T = unknown>() {
      return _json ?? (_json = await response.json<T>());
    },
    async text() {
      return _text ?? (_text = await response.text());
    },
  };
}
