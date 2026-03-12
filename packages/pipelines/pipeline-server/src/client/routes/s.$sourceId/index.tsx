import { SourceFileCard } from "#components/source-file-card";
import { SourceIssuesDialog } from "#components/source-issues-dialog";
import { sourceQueryOptions } from "#queries/source";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

export const Route = createFileRoute("/s/$sourceId/")({
  loader: async ({ context, params }) => {
    const source = await context.queryClient.ensureQueryData(sourceQueryOptions({ sourceId: params.sourceId }));

    return {
      source,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId } = Route.useParams();
  const { source } = Route.useLoaderData();

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{source.label}</CardTitle>
              <CardDescription>{source.type}</CardDescription>
            </div>
            <Badge variant="secondary">
              {source.files.length}
              {" "}
              {source.files.length === 1 ? "file" : "files"}
            </Badge>
          </div>
        </CardHeader>
        {source.errors.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">
              <div className="text-sm text-destructive">
                {source.errors.length}
                {" "}
                source issue
                {source.errors.length === 1 ? "" : "s"}
              </div>
              <SourceIssuesDialog
                issues={source.errors}
                title={`${source.label} issues`}
                description="Detailed source loading issues for this source."
              />
            </div>
          </CardContent>
        )}
      </Card>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {source.files.map((file) => (
          <SourceFileCard key={file.id} sourceId={sourceId} file={file} />
        ))}
      </section>
    </div>
  );
}
