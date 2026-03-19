import { RouteDependenciesSection } from "#components/inspect/route-dependencies-section";
import { RouteFlowSection } from "#components/inspect/route-flow-section";
import { RouteOutputsSection } from "#components/inspect/route-outputs-section";
import { RouteTransformsSection } from "#components/inspect/route-transforms-section";
import { useInspectData } from "#hooks/use-inspect-data";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Filter, GitBranchPlus, Layers3, Link2, RouteIcon } from "lucide-react";

export function InspectRoutesPanel() {
  const { pipeline, selectedRoute } = useInspectData();

  if (!selectedRoute) {
    return (
      <Card>
        <CardHeader className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
            <RouteIcon className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <CardTitle className="text-base">No route selected</CardTitle>
          <CardDescription>
            Click a route from the sidebar to inspect its dependencies, transforms, and outputs.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/40">
            <RouteIcon className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-lg">{selectedRoute.id}</CardTitle>
              {selectedRoute.cache
                ? <Badge variant="secondary" className="shrink-0">cached</Badge>
                : <Badge variant="outline" className="shrink-0">live</Badge>}
            </div>
            <CardDescription className="mt-0.5">
              Route dependencies, transforms, and output definitions.
            </CardDescription>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" />
              Dependencies
            </div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{selectedRoute.depends.length}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GitBranchPlus className="h-3.5 w-3.5" />
              Transforms
            </div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{selectedRoute.transforms.length}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers3 className="h-3.5 w-3.5" />
              Outputs
            </div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{selectedRoute.outputs.length}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Filters</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/60 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Route filter</div>
              <code className="mt-1.5 block text-xs">
                {selectedRoute.filter ?? "Custom filter"}
              </code>
            </div>
            {pipeline.include && (
              <div className="rounded-lg border border-border/60 p-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Pipeline include</div>
                <code className="mt-1.5 block text-xs">
                  {pipeline.include}
                </code>
              </div>
            )}
          </div>
        </section>

        <RouteFlowSection />
        <RouteDependenciesSection />
        <RouteTransformsSection />
        <RouteOutputsSection />
      </CardContent>
    </Card>
  );
}
