import type { PipelineDefinition } from "@ucdjs/pipelines-core";

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
}

/**
 * Detailed pipeline info including routes.
 */
export interface PipelineDetails extends PipelineInfo {
  routes: Array<{
    id: string;
    cache: boolean;
  }>;
  sources: Array<{
    id: string;
  }>;
}

/**
 * Convert a PipelineDefinition to serializable PipelineInfo.
 */
export function toPipelineInfo(pipeline: PipelineDefinition): PipelineInfo {
  return {
    id: pipeline.id,
    name: pipeline.name,
    description: pipeline.description,
    versions: pipeline.versions,
    routeCount: pipeline.routes.length,
    sourceCount: pipeline.inputs.length,
  };
}

/**
 * Convert a PipelineDefinition to detailed info.
 */
export function toPipelineDetails(pipeline: PipelineDefinition): PipelineDetails {
  return {
    ...toPipelineInfo(pipeline),
    routes: pipeline.routes.map((route) => ({
      id: route.id,
      cache: route.cache !== false,
    })),
    sources: pipeline.inputs.map((source) => ({
      id: source.id,
    })),
  };
}
