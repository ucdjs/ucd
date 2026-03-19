import type { PipelineDetails } from "#shared/schemas/pipeline";
import { getRouteApi } from "@tanstack/react-router";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");
const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");

export type InspectPipelineRoute = PipelineDetails["routes"][number];

export function useInspectData() {
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const search = InspectRoute.useSearch();
  const selectedRoute = pipeline.routes.find((route) => route.id === search.route) ?? null;

  return { pipeline, search, selectedRoute };
}
