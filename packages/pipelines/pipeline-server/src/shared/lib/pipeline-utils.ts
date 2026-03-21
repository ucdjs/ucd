import type { PipelineDetails, PipelineInfo } from "#shared/schemas/pipeline";
import type { PipelineDefinition, PipelineRouteDefinition } from "@ucdjs/pipelines-core";
import { getFilterDescription, normalizeRouteOutputs, parseDependency } from "@ucdjs/pipelines-core";

export function toPipelineInfo(pipeline: PipelineDefinition): PipelineInfo {
  return {
    id: pipeline.id,
    name: pipeline.name,
    description: pipeline.description,
    tags: pipeline.tags,
    versions: pipeline.versions,
    routeCount: pipeline.routes.length,
    sourceCount: pipeline.inputs.length,
    sourceId: pipeline.inputs[0]?.id ?? "local",
  };
}

export function toPipelineDetails(pipeline: PipelineDefinition): PipelineDetails {
  return {
    ...toPipelineInfo(pipeline),
    include: pipeline.include ? getFilterDescription(pipeline.include) : undefined,
    routes: pipeline.routes.map((route) => toRouteDetails(route)),
    sources: pipeline.inputs.map((source) => ({ id: source.id })),
  };
}

export function toRouteDetails(
  route: PipelineRouteDefinition,
): PipelineDetails["routes"][number] {
  const depends = (route.depends ?? []).map((dep) => parseDependency(dep));
  const emits = Object.entries(route.emits ?? {}).map(([id, def]) => {
    const scope = def.scope === "global" ? "global" : "version";
    return { id, scope } as const;
  });

  const outputs = normalizeRouteOutputs(route).map((output) => ({
    id: output.id,
    sink: output.sink?.type ?? "runtime",
    format: output.format,
    path: typeof output.path === "string" ? output.path : undefined,
    dynamicPath: typeof output.path === "function",
    pathSource: typeof output.path === "function" ? formatFunctionPreview(output.path) : undefined,
  }));

  const transformList = (route.transforms ?? []) as { id?: string }[];
  const transforms = transformList.map((transform, index) => {
    const id = transform.id;
    return id ?? `transform-${index + 1}`;
  });

  return {
    id: route.id,
    cache: route.cache !== false,
    depends,
    emits,
    filter: route.filter ? getFilterDescription(route.filter) : undefined,
    outputs,
    transforms,
  };
}

function formatFunctionPreview(fn: (...args: never[]) => unknown): string {
  const source = fn.toString().trim();
  return source.length > 240 ? `${source.slice(0, 237)}...` : source;
}
