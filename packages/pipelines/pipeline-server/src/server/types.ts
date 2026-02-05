import type { PipelineDefinition, PipelineRouteDefinition } from "@ucdjs/pipelines-core";
import { parseDependency } from "@ucdjs/pipelines-core";

/**
 * Serializable pipeline info for the API.
 */
export interface PipelineInfo {
  id: string;
  name?: string;
  description?: string;
  versions: string[];
  routeCount: number;
  sourceCount: number;
  sourceId: string;
}

/**
 * Detailed pipeline info including routes.
 */
export interface PipelineDetails extends PipelineInfo {
  routes: Array<{
    id: string;
    cache: boolean;
    depends: Array<
      | { type: "route"; routeId: string }
      | { type: "artifact"; routeId: string; artifactName: string }
    >;
    emits: Array<{ id: string; scope: "version" | "global" }>;
    outputs: Array<{ dir?: string; fileName?: string }>;
    transforms: string[];
  }>;
  sources: Array<{
    id: string;
  }>;
}

/**
 * Convert a PipelineDefinition to serializable PipelineInfo.
 */
export function toPipelineInfo(pipeline: PipelineDefinition, sourceId?: string): PipelineInfo {
  return {
    id: pipeline.id,
    name: pipeline.name,
    description: pipeline.description,
    versions: pipeline.versions,
    routeCount: pipeline.routes.length,
    sourceCount: pipeline.inputs.length,
    sourceId: sourceId ?? "local",
  };
}

/**
 * Convert a PipelineDefinition to detailed info.
 */
export function toPipelineDetails(pipeline: PipelineDefinition): PipelineDetails {
  return {
    ...toPipelineInfo(pipeline),
    routes: pipeline.routes.map((route) => toRouteDetails(route)),
    sources: pipeline.inputs.map((source) => ({
      id: source.id,
    })),
  };
}

function toRouteDetails(route: PipelineRouteDefinition): PipelineDetails["routes"][number] {
  const depends = (route.depends ?? []).map((dep) => parseDependency(dep));
  const emits = Object.entries(route.emits ?? {}).map(([id, def]) => {
    const scope = def.scope === "global" ? "global" : "version";
    return { id, scope } as const;
  });
  const outputs = route.out
    ? [{ dir: route.out.dir, fileName: typeof route.out.fileName === "function" ? "[fn]" : route.out.fileName }]
    : [];
  const transformList = (route.transforms ?? []) as Array<{ id?: string }>;
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
