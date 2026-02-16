import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import worker from "../../src/worker";

export interface ExecuteRequestResult {
  response: Response;
  ctx: ReturnType<typeof createExecutionContext>;
  json: <T = unknown>() => Promise<T>;
  text: () => Promise<string>;
}

export async function executeRequest(
  request: Request,
  env: Cloudflare.Env,
): Promise<ExecuteRequestResult> {
  const ctx = createExecutionContext();
  // @ts-expect-error worker fetch accepts generated cloudflare env in tests
  const response = await worker.fetch(request, env, ctx);

  await waitOnExecutionContext(ctx);

  let parsedJson: unknown;
  let parsedText: string;

  return {
    response,
    ctx,
    async json<T = unknown>() {
      return parsedJson ? parsedJson as T : (parsedJson = await response.json<T>()) as T;
    },
    async text() {
      return parsedText ?? (parsedText = await response.text());
    },
  };
}
