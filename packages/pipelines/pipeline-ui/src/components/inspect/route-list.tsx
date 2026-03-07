import type { PipelineDetails } from "../../types";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { useMemo } from "react";

type RouteInfo = PipelineDetails["routes"][number];

export interface RouteListProps {
  routes: RouteInfo[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
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

export function RouteList({
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
