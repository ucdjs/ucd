import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { customError, internalServerError, notFound } from "./errors";

export const errorHandler: ErrorHandler<any> = async (err, c) => {
  console.error("[worker-shared]: Error processing request:", c.req.path);
  console.error("[worker-shared]: Error details:", err);
  if (err instanceof HTTPException) {
    return customError({
      status: err.status,
      message: err.message,
    });
  }

  return internalServerError();
};

export const notFoundHandler: NotFoundHandler<any> = (c) => {
  console.error("[worker-shared]: Not Found:", c.req.path);
  return notFound();
};
