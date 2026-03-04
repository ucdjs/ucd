import { useSuspenseQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { EmptyRouteDetails, RouteDetails, RouteList } from "@ucdjs/pipelines-ui";
import { pipelineQueryOptions } from "@ucdjs/pipelines-ui/functions";
import { useMemo, useState } from "react";

export const Route = createLazyFileRoute("/$sourceId/$fileId/$pipelineId/inspect")({
  component: PipelineInspectPage,
  pendingComponent: PipelineInspectSkeleton,
});

function PipelineInspectPage() {
  const { sourceId, fileId, pipelineId } = Route.useParams();
  const { data } = useSuspenseQuery(
    pipelineQueryOptions({ sourceId, fileId, pipelineId }),
  );
  const pipeline = data?.pipeline;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const routes = useMemo(() => pipeline?.routes ?? [], [pipeline?.routes]);

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const value = searchQuery.trim().toLowerCase();
    return routes.filter((route) => route.id.toLowerCase().includes(value));
  }, [searchQuery, routes]);

  const selectedRoute = useMemo(() => {
    return filteredRoutes.find((route) => route.id === selectedRouteId) ?? filteredRoutes[0] ?? null;
  }, [filteredRoutes, selectedRouteId]);

  if (!pipeline) {
    return <div className="p-6" />;
  }

  return (
    <div
      className="p-6 grid gap-6 lg:grid-cols-[minmax(300px,0.7fr)_minmax(400px,1fr)]"
      role="tabpanel"
      id="tabpanel-inspect"
      aria-labelledby="tab-inspect"
    >
      <RouteList
        routes={routes}
        selectedRouteId={selectedRoute?.id ?? null}
        onSelectRoute={setSelectedRouteId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {selectedRoute
        ? (
            <RouteDetails route={selectedRoute} />
          )
        : (
            <EmptyRouteDetails />
          )}
    </div>
  );
}

function PipelineInspectSkeleton() {
  return (
    <div className="p-6 grid gap-6 lg:grid-cols-[minmax(300px,0.7fr)_minmax(400px,1fr)]">
      <div className="rounded-xl border bg-card">
        <div className="p-3 border-b">
          <div className="h-8 w-full rounded-md bg-muted animate-pulse" />
        </div>
        <div className="p-1.5 space-y-0.5">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={`route-${i}`} className="flex items-center gap-2 rounded-md px-3 py-2">
              <span className="w-3 h-3 rounded bg-muted animate-pulse shrink-0" />
              <span className="h-3 rounded bg-muted animate-pulse" style={{ width: `${50 + ((i * 17) % 40)}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <span className="block w-48 h-5 rounded bg-muted animate-pulse" />
        <div className="space-y-2">
          <span className="block w-full h-3 rounded bg-muted animate-pulse" />
          <span className="block w-3/4 h-3 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-px bg-border" />
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={`detail-${i}`} className="flex justify-between">
              <span className="w-20 h-3 rounded bg-muted animate-pulse" />
              <span className="w-32 h-3 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
