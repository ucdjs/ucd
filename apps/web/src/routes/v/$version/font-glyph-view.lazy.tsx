import { VersionHeader } from "#components/layout/version/header";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

export const Route = createLazyFileRoute("/v/$version/font-glyph-view")({
  component: FontGlyphViewVersion,
});

function FontGlyphViewVersion() {
  const params = Route.useParams();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <VersionHeader version={params.version} title="Font & Glyph View" />

      <div className="flex flex-1 flex-col gap-6 pt-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Font & Glyph View —
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
    </div>
  );
}
