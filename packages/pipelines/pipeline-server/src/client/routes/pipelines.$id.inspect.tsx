import type { PipelineDetails } from "@ucdjs/pipelines-ui";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { useEffect, useMemo, useState } from "react";
import { usePipelineDetailContext } from "../hooks/pipeline-detail-context";

export const Route = createFileRoute("/pipelines/$id/inspect")({
  component: PipelineInspectPage,
});

type RouteInfo = PipelineDetails["routes"][number];
type Dependency = RouteInfo["depends"][number];
type EmittedArtifact = RouteInfo["emits"][number];
type OutputConfig = RouteInfo["outputs"][number];

interface RouteListProps {
  routes: RouteInfo[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function RouteListCard({
  routes,
  selectedRouteId,
  onSelectRoute,
  searchQuery,
  onSearchChange,
}: RouteListProps) {
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const value = searchQuery.trim().toLowerCase();
    return routes.filter((route) => route.id.toLowerCase().includes(value));
  }, [searchQuery, routes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Routes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search routes"
          aria-label="Search routes"
        />
        <div className="space-y-2" role="list">
          {filteredRoutes.length === 0
            ? (
                <p className="text-sm text-muted-foreground">No routes match the search.</p>
              )
            : (
                filteredRoutes.map((route) => (
                  <RouteListItem
                    key={route.id}
                    route={route}
                    isSelected={route.id === selectedRouteId}
                    onClick={() => onSelectRoute(route.id)}
                  />
                ))
              )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RouteListItemProps {
  route: RouteInfo;
  isSelected: boolean;
  onClick: () => void;
}

function RouteListItem({ route, isSelected, onClick }: RouteListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="listitem"
      aria-selected={isSelected}
      className={cn(
        "w-full text-left rounded-md border px-3 py-2 text-sm transition",
        isSelected
          ? "border-primary/40 bg-primary/5"
          : "border-border hover:bg-muted/50",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">{route.id}</span>
        {route.cache
          ? (
              <Badge variant="secondary">cache</Badge>
            )
          : (
              <Badge variant="outline">no cache</Badge>
            )}
      </div>
      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>
          {route.depends.length}
          {" "}
          depends
        </span>
        <span>
          {route.emits.length}
          {" "}
          emits
        </span>
        <span>
          {route.outputs.length}
          {" "}
          outputs
        </span>
      </div>
    </button>
  );
}

interface RouteDetailsProps {
  route: RouteInfo;
}

function RouteDetailsCard({ route }: RouteDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DependsSection depends={route.depends} />
        <EmitsSection emits={route.emits} />
        <OutputsSection outputs={route.outputs} />
        <TransformsSection transforms={route.transforms} />
      </CardContent>
    </Card>
  );
}

interface DependsSectionProps {
  depends: readonly Dependency[];
}

function DependsSection({ depends }: DependsSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Depends</h3>
      {depends.length === 0
        ? (
            <p className="text-sm text-muted-foreground">No dependencies.</p>
          )
        : (
            <div className="flex flex-wrap gap-2">
              {depends.map((dep, index) => (
                <Badge key={`${dep.type}-${index}`} variant="outline">
                  {dep.type === "route"
                    ? `route:${dep.routeId}`
                    : `artifact:${dep.routeId}:${dep.artifactName}`}
                </Badge>
              ))}
            </div>
          )}
    </section>
  );
}

interface EmitsSectionProps {
  emits: readonly EmittedArtifact[];
}

function EmitsSection({ emits }: EmitsSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Emits</h3>
      {emits.length === 0
        ? (
            <p className="text-sm text-muted-foreground">No emitted artifacts.</p>
          )
        : (
            <div className="flex flex-wrap gap-2">
              {emits.map((emit) => (
                <Badge key={emit.id} variant="secondary">
                  {emit.id}
                  {" "}
                  <span className="text-[10px] opacity-70">{emit.scope}</span>
                </Badge>
              ))}
            </div>
          )}
    </section>
  );
}

interface OutputsSectionProps {
  outputs: readonly OutputConfig[];
}

function OutputsSection({ outputs }: OutputsSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Outputs</h3>
      {outputs.length === 0
        ? (
            <p className="text-sm text-muted-foreground">No output configuration.</p>
          )
        : (
            <div className="space-y-2">
              {outputs.map((output, index) => (
                <div key={index} className="rounded-md border border-border p-3 text-sm">
                  <div className="text-muted-foreground">
                    dir:
                    {" "}
                    {output.dir ?? "default"}
                  </div>
                  <div className="text-muted-foreground">
                    file:
                    {" "}
                    {output.fileName ?? "default"}
                  </div>
                </div>
              ))}
            </div>
          )}
    </section>
  );
}

interface TransformsSectionProps {
  transforms: readonly string[];
}

function TransformsSection({ transforms }: TransformsSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Transforms</h3>
      {transforms.length === 0
        ? (
            <p className="text-sm text-muted-foreground">No transforms.</p>
          )
        : (
            <div className="flex flex-wrap gap-2">
              {transforms.map((transform, index) => (
                <Badge key={`${transform}-${index}`} variant="outline">
                  {transform}
                </Badge>
              ))}
            </div>
          )}
    </section>
  );
}

function EmptyDetailsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Select a route to inspect.</p>
      </CardContent>
    </Card>
  );
}

function PipelineInspectPage() {
  const { pipeline } = usePipelineDetailContext();
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

  // Reset selected route when filtered routes change
  useEffect(() => {
    if (filteredRoutes.length === 0) {
      setSelectedRouteId(null);
    } else if (!selectedRouteId || !filteredRoutes.some((route) => route.id === selectedRouteId)) {
      setSelectedRouteId(filteredRoutes[0]!.id);
    }
  }, [filteredRoutes, selectedRouteId]);

  if (!pipeline) {
    return null;
  }

  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(300px,0.7fr)_minmax(400px,1fr)]"
      role="tabpanel"
      id="tabpanel-inspect"
      aria-labelledby="tab-inspect"
    >
      <RouteListCard
        routes={routes}
        selectedRouteId={selectedRoute?.id ?? null}
        onSelectRoute={setSelectedRouteId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {selectedRoute
        ? (
            <RouteDetailsCard route={selectedRoute} />
          )
        : (
            <EmptyDetailsCard />
          )}
    </div>
  );
}
