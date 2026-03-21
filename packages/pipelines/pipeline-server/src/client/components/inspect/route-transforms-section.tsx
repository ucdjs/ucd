import { useInspectData } from "#hooks/use-inspect-data";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowRight, Shuffle } from "lucide-react";

export function RouteTransformsSection() {
  const { selectedRoute, navigateToTransform } = useInspectData();

  if (!selectedRoute) return null;

  return (
    <Card>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Shuffle className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Transforms</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
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
      </CardContent>
    </Card>
  );
}
