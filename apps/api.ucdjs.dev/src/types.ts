import type { z } from "zod";
import type { ApiErrorSchema } from "./schemas";

export interface HonoEnv {
  Bindings: Env;
}

export type ApiError = z.infer<typeof ApiErrorSchema>;
