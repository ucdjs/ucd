import type { PipelineDetails } from "#shared/schemas/pipeline";
import { getRouteApi } from "@tanstack/react-router";

const PipelineRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId");
const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");

export type InspectPipelineRoute = PipelineDetails["routes"][number];

export function useInspectData() {
  const { pipelineResponse } = PipelineRoute.useLoaderData();
  const pipeline = pipelineResponse.pipeline;
  const params = InspectRoute.useParams();
  const search = InspectRoute.useSearch();
  const navigate = InspectRoute.useNavigate();
  const selectedOutputRouteId = typeof search.output === "string"
    ? search.output.split(":")[0]
    : undefined;
  const selectedRouteId = search.route ?? selectedOutputRouteId;
  const selectedRoute = pipeline.routes.find((route) => route.id === selectedRouteId) ?? null;

  function setSearchQuery(q?: string) {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
      params,
      search: {
        q,
        route: search.route,
        transform: search.transform,
        output: search.output,
      },
    });
  }

  function navigateToRoute(routeId: string) {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
      params,
      search: {
        q: search.q,
        route: routeId,
        transform: undefined,
        output: undefined,
      },
    });
  }

  function navigateToTransform(transform: string, routeId?: string) {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
      params,
      search: {
        q: search.q,
        route: routeId ?? search.route,
        transform,
        output: undefined,
      },
    });
  }

  function navigateToOutput(routeId: string, outputIndex: number) {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
      params,
      search: {
        q: search.q,
        route: routeId,
        transform: undefined,
        output: `${routeId}:${outputIndex}`,
      },
    });
  }

  function clearRouteFocus() {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
      params,
      search: {
        q: search.q,
        route: undefined,
        transform: undefined,
        output: undefined,
      },
    });
  }

  function clearTransformFocus() {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
      params,
      search: {
        q: search.q,
        route: search.route,
        transform: undefined,
        output: search.output,
      },
    });
  }

  function clearOutputFocus() {
    navigate({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
      params,
      search: {
        q: search.q,
        route: search.route,
        transform: search.transform,
        output: undefined,
      },
    });
  }

  return {
    params,
    pipeline,
    search,
    selectedRoute,
    setSearchQuery,
    navigateToRoute,
    navigateToTransform,
    navigateToOutput,
    clearRouteFocus,
    clearTransformFocus,
    clearOutputFocus,
  };
}
