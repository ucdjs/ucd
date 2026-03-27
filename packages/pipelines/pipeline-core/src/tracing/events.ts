import type { FileContext } from "../types";

export type PipelineErrorScope = "pipeline" | "version" | "file" | "route";

export interface PipelineError {
  scope: PipelineErrorScope;
  message: string;
  error?: unknown;
  file?: FileContext;
  routeId?: string;
  version?: string;
}
