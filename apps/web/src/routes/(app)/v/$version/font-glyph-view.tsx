import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/components";

export const Route = createFileRoute("/(app)/v/$version/font-glyph-view")({
  component: FontGlyphViewVersion,
  loader: () => ({ crumb: "Font & Glyph View" }),
});

function FontGlyphViewVersion() {
  const params = Route.useParams();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Font & Glyph View -
            {" "}
            {params.version}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Inspect how code points and sequences map to fonts, glyph metrics, and renderings for Unicode
            {" "}
            {params.version}
            . Useful for diagnosing rendering mismatches.
          </p>
          <Button nativeButton={false} render={<Link to="/v/$version" params={{ version: params.version }}>Back to version</Link>} />
        </CardContent>
      </Card>
    </div>
  );
}
