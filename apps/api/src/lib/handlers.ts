import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { customError, internalServerError, notFound } from "./errors";

export const errorHandler: ErrorHandler<any> = async (err, c) => {
  console.error("[api]: Error processing request:", c.req.path);
  console.error("[api]: Error details:", err);
  if (err instanceof HTTPException) {
    return customError({
      status: err.status,
      message: err.message,
    });
  }

  return internalServerError();
};

export const notFoundHandler: NotFoundHandler<any> = (c) => {
  console.error("[api]: Not Found:", c.req.path);
  return notFound();
};