import { RouteDependenciesSection } from "#components/inspect/route-dependencies-section";
import { RouteFlowSection } from "#components/inspect/route-flow-section";
import { RouteOutputsSection } from "#components/inspect/route-outputs-section";
import { RouteTransformsSection } from "#components/inspect/route-transforms-section";
import { useInspectData } from "#hooks/use-inspect-data";
import { Filter } from "lucide-react";

export function RoutesContent() {
  const { pipeline, selectedRoute } = useInspectData();

  if (!selectedRoute) return null;

  return (
    <>
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
    </>
  );
}
