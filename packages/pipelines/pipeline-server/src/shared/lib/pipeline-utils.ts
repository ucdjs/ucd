import type { PipelineDefinition, PipelineRouteDefinition } from "@ucdjs/pipelines-core";
import type { PipelineDetails, PipelineInfo } from "../types";
import { parseDependency } from "@ucdjs/pipelines-core";

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

  const outputs = route.out
    ? [{ dir: route.out.dir, fileName: typeof route.out.fileName === "function" ? "[fn]" : route.out.fileName }]
    : [];

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
    outputs,
    transforms,
  };
}
