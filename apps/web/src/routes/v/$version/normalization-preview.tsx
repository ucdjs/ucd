import { VersionHeader } from "#components/layout/version/header";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/components";

export const Route = createFileRoute("/v/$version/normalization-preview")({
  component: NormalizationPreviewVersion,
});

function NormalizationPreviewVersion() {
  const params = Route.useParams();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <VersionHeader version={params.version} title="Normalization Preview" />

      <Card>
        <CardHeader>
          <CardTitle>
            Normalization Preview —
            {" "}
            {params.version}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Inspect how text normalizes under NFC/NFD/NFKC/NFKD for Unicode
            {" "}
            {params.version}
            . Useful for detecting equivalence changes between versions.
          </p>
          <Button nativeButton={false} render={<Link to="/v/$version" params={{ version: params.version }}>Back to version</Link>} />
        </CardContent>
      </Card>
    </div>
  );
}
