import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

export const Route = createLazyFileRoute("/(app)/v/$version/bidi-linebreak")({
  component: BidiLinebreakVersion,
});

function BidiLinebreakVersion() {
  const params = Route.useParams();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex flex-1 flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              BIDI & Line Break —
              {" "}
              {params.version}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Visualize bidirectional ordering and line break opportunities for sample text using Unicode
              {" "}
              {params.version}
              {" "}
              rules.
            </p>
            <Button nativeButton={false} render={<Link to="/v/$version" params={{ version: params.version }}>Back to version</Link>} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
