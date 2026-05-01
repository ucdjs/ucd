import type { FileContext, PipelineLogger } from "./types";

export type PipelineHookPhase = "start" | "end";

export interface PipelineHookContext {
  phase: PipelineHookPhase;
  pipelineId: string;
  logger: PipelineLogger;
  error?: unknown;
}

export interface PipelineVersionHookContext extends PipelineHookContext {
  version: string;
}

export interface PipelineRouteHookContext extends PipelineVersionHookContext {
  file: FileContext;
  routeId: string;
  outputs?: readonly unknown[];
}

export interface PipelineParseHookContext extends PipelineRouteHookContext {
  rowCount?: number;
  filteredRowCount?: number;
}

export type PipelineResolveHookContext = PipelineRouteHookContext;

export interface PipelineOutputHookContext extends PipelineRouteHookContext {
  outputIndex: number;
  outputId: string;
  property?: string;
  sink: string;
  locator: string;
  status?: "written" | "failed";
}

export interface PipelineHooks {
  pipeline?: (ctx: PipelineHookContext) => void | Promise<void>;
  version?: (ctx: PipelineVersionHookContext) => void | Promise<void>;
  route?: (ctx: PipelineRouteHookContext) => void | Promise<void>;
  parse?: (ctx: PipelineParseHookContext) => void | Promise<void>;
  resolve?: (ctx: PipelineResolveHookContext) => void | Promise<void>;
  output?: (ctx: PipelineOutputHookContext) => void | Promise<void>;
}

export function hasPipelineHooks(hooks: PipelineHooks | undefined): hooks is PipelineHooks {
  return hooks != null && Object.values(hooks).some(Boolean);
}
