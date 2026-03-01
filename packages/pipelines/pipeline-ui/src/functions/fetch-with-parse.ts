import type { ZodSchema } from "zod";
import type { ErrorResponse } from "../schemas/common";
import { ErrorResponseSchema } from "../schemas/common";

export class ApiError extends Error {
  response: ErrorResponse;
  status: number;

  constructor(response: ErrorResponse, status: number) {
    super(response.error);
    this.name = "ApiError";
    this.response = response;
    this.status = status;
  }
}

export async function fetchWithParse<T>(
  url: string,
  schema: ZodSchema<T>,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    // Parse as error response when status is not ok
    const errorResult = ErrorResponseSchema.safeParse(data);
    if (errorResult.success) {
      throw new ApiError(errorResult.data, res.status);
    }
    // Fallback for unexpected error format
    throw new ApiError({ error: `HTTP ${res.status}: ${res.statusText}` }, res.status);
  }

  // Parse successful response with provided schema
  return schema.parse(data);
}
