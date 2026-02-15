import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { z, ZodType } from "zod";
import { customError } from "./errors";

export function strictJSONResponse<
  C extends Context,
  S extends ZodType,
  D extends Parameters<Context["json"]>[0] & z.infer<S>,
  U extends ContentfulStatusCode,
>(c: C, schema: S, data: D, statusCode?: U): Response {
  const validatedResponse = schema.safeParse(data);

  if (!validatedResponse.success) {
    return customError({
      status: 400,
      message: `Invalid response data: ${validatedResponse.error.message}`,
    });
  }

  return c.json(validatedResponse.data as D, statusCode);
}
