import type { ErrorHandler, NotFoundHandler } from "hono";
import { createDebugger } from "@ucdjs-internal/shared";
import { customError, internalServerError, notFound } from "@ucdjs-internal/worker-utils";
import { HTTPException } from "hono/http-exception";

const debug = createDebugger("ucdjs:api");

export const errorHandler: ErrorHandler<any> = async (err, c) => {
  debug?.("Error processing request", { path: c.req.path, error: err });
  if (err instanceof HTTPException) {
    return customError({
      status: err.status,
      message: err.message,
    });
  }

  return internalServerError();
};

export const notFoundHandler: NotFoundHandler<any> = (c) => {
  debug?.("Not Found", { path: c.req.path });
  return notFound();
};
