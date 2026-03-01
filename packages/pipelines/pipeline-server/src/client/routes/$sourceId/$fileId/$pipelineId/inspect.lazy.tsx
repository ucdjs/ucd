import { createLazyFileRoute, useLoaderData } from "@tanstack/react-router";
import { EmptyRouteDetails, RouteDetails, RouteList } from "@ucdjs/pipelines-ui";
import { useEffect, useMemo, useState } from "react";

export const Route = createLazyFileRoute("/$sourceId/$fileId/$pipelineId/inspect")({
  component: PipelineInspectPage,
});

function PipelineInspectPage() {
  const { pipeline } = useLoaderData({ from: "/$sourceId/$fileId/$pipelineId" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const routes = pipeline?.routes ?? [];

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const value = searchQuery.trim().toLowerCase();
    return routes.filter((route) => route.id.toLowerCase().includes(value));
  }, [searchQuery, routes]);

  const selectedRoute = useMemo(() => {
    return filteredRoutes.find((route) => route.id === selectedRouteId) ?? filteredRoutes[0] ?? null;
  }, [filteredRoutes, selectedRouteId]);

  useEffect(() => {
    if (filteredRoutes.length === 0) {
      setSelectedRouteId(null);
    } else if (!selectedRouteId || !filteredRoutes.some((route) => route.id === selectedRouteId)) {
      setSelectedRouteId(filteredRoutes[0]!.id);
    }
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
