import { useInspectData } from "#hooks/use-inspect-data";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { ArrowRight, Shuffle } from "lucide-react";

export function RouteTransformsSection() {
  const { selectedRoute, navigateToTransform } = useInspectData();

  if (!selectedRoute) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Shuffle className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Transforms</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedRoute.transforms.length
          ? selectedRoute.transforms.map((transform) => {
              return (
                <Button
                  key={transform}
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToTransform(transform, selectedRoute.id)}
                >
                  {transform}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              );
            })
          : <span className="text-sm text-muted-foreground">No transforms.</span>}
      </div>
      {selectedRoute.transforms.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
          Choose a transform to inspect how it is reused across the rest of the pipeline.
        </div>
      )}
    </section>
  );
}
