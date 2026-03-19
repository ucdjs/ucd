import { getRouteApi } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { ArrowRight, RouteIcon, Shuffle } from "lucide-react";

const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");

interface TransformsContentProps {
  transforms: { name: string; routes: string[] }[];
  selectedTransform: { name: string; routes: string[] };
}

export function TransformsContent({ transforms, selectedTransform }: TransformsContentProps) {
  const navigate = InspectRoute.useNavigate();

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Shuffle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Pipeline transforms</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {transforms.map((transform) => {
            const active = transform.name === selectedTransform.name;
            return (
              <Button
                key={transform.name}
                variant="outline"
                size="xs"
                onClick={() => {
                  navigate({
                    search: (current) => ({
                      ...current,
                      transform: transform.name,
                    }),
                  });
                }}
                className={active ? "border-primary/40 bg-primary/5" : ""}
              >
                {transform.name}
              </Button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <RouteIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Routes</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {selectedTransform.routes.map((routeId) => (
            <Button
              key={routeId}
              variant="ghost"
              onClick={() => {
                navigate({
                  search: (current) => ({
                    ...current,
                    route: routeId,
                    view: undefined,
                    transform: selectedTransform.name,
                  }),
                });
              }}
              className="h-auto justify-start rounded-lg border border-border/60 bg-muted/10 p-4 text-left hover:bg-muted/20"
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{routeId}</div>
                  <div className="text-xs text-muted-foreground">Open route inspect view</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          ))}
        </div>
      </section>
    </>
  );
}
