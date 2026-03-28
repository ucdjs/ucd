import type {
  AnyPipelineDefinition,
  AnyPipelineRouteDefinition,
  NormalizedRouteOutputDefinition,
} from "@ucdjs/pipelines-core";
import type { PipelineSummary } from "../types";
import { getExecutionLayers, normalizeRouteOutputs } from "@ucdjs/pipelines-core";

export type { PipelineExecutorRunOptions } from "../types";

export function resolveVersions(
  pipeline: AnyPipelineDefinition,
  runOptions: { versions?: string[] } = {},
): string[] {
  return runOptions.versions ?? pipeline.versions;
}

export function buildRoutesByLayer(
  pipeline: AnyPipelineDefinition,
): AnyPipelineRouteDefinition[][] {
  const routesById = new Map<string, AnyPipelineRouteDefinition>(
    pipeline.routes.map((route: AnyPipelineRouteDefinition) => [route.id, route] as const),
  );

  return getExecutionLayers(pipeline.dag).map((layer) => {
    return layer.reduce<AnyPipelineRouteDefinition[]>((routes, id) => {
      const route = routesById.get(id);
      if (route) {
        routes.push(route);
      }
      return routes;
    }, []);
  });
}

export function buildRouteOutputs(
  pipeline: AnyPipelineDefinition,
): Map<string, readonly NormalizedRouteOutputDefinition[]> {
  return new Map(
    pipeline.routes.map((route: AnyPipelineRouteDefinition) => [route.id, normalizeRouteOutputs(route)] as const),
  );
}

export function createSummary(versions: string[]): PipelineSummary {
  return {
    versions,
    totalRoutes: 0,
    cached: 0,
    totalFiles: 0,
    matchedFiles: 0,
    skippedFiles: 0,
    fallbackFiles: 0,
    totalOutputs: 0,
    durationMs: 0,
  };
}
