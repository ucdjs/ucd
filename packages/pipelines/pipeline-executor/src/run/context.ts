import type {
  FileContext,
  ParseContext,
  PipelineLogger,
  ResolveContext,
  TransformContext,
} from "@ucdjs/pipelines-core";
import type { PipelineExecutionRuntime } from "../runtime";
import type { SourceAdapter } from "./source";
import { trace } from "@opentelemetry/api";
import { createParseContext } from "./source";

export interface ExecutionContext {
  pipelineId: string;
  version: string;
  file: FileContext;
  logger: PipelineLogger;
  source: SourceAdapter;
  runtime: PipelineExecutionRuntime;
  routeDataMap: Record<string, unknown[]>;
}

export function buildParseContext(ctx: ExecutionContext): ParseContext {
  return createParseContext(ctx.file, ctx.source, ctx.logger);
}

export function buildResolveContext(
  ctx: ExecutionContext,
  routeId: string,
): ResolveContext {
  const { version, file, logger, routeDataMap } = ctx;

  return {
    version,
    file,
    logger,
    getRouteData: <T = unknown>(targetRouteId: string) => {
      const exists = targetRouteId in routeDataMap;
      trace.getActiveSpan()?.addEvent("dependency.resolve", {
        "route.id": routeId,
        "depends.on.route.id": targetRouteId,
        "dependency.status": exists ? "resolved" : "missing",
        "pipeline.version": version,
      });
      if (!exists) {
        throw new Error(
          `Route data for "${targetRouteId}" not found. Make sure route "${targetRouteId}" runs before route "${routeId}" by declaring it as a dependency.`,
        );
      }
      return Object.freeze(routeDataMap[targetRouteId]!) as readonly T[];
    },
    normalizeEntries: (entries) => {
      return entries.sort((a, b) => {
        const aStart = a.range?.split("..")[0] ?? a.codePoint ?? "";
        const bStart = b.range?.split("..")[0] ?? b.codePoint ?? "";
        return aStart.localeCompare(bStart);
      });
    },
    now: () => new Date().toISOString(),
  };
}

export function buildTransformContext(ctx: ExecutionContext): TransformContext {
  return {
    version: ctx.version,
    file: ctx.file,
    logger: ctx.logger,
  };
}
