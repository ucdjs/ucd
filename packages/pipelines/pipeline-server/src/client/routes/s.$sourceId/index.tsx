import { SourceFileCard } from "#components/source-file-card";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { sourceFileQueryOptions, sourceQueryOptions } from "#functions";

export const Route = createFileRoute("/s/$sourceId/")({
  loader: async ({ context, params }) => {
    const source = await context.queryClient.ensureQueryData(
      sourceQueryOptions({ sourceId: params.sourceId }),
    );

    const fileDetails = await Promise.all(
      source.files.map((file) =>
        context.queryClient.ensureQueryData(sourceFileQueryOptions({
          sourceId: params.sourceId,
          fileId: file.id,
        }))),
    );

    const files = source.files.map((file) => ({
      ...file,
      pipelines: fileDetails.find((detail) => detail.id === file.id)?.pipelines ?? [],
    }));

    return {
      source,
      files,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId } = Route.useParams();
  const { source, files } = Route.useLoaderData();

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
              {files.length}
              {" "}
              {files.length === 1 ? "file" : "files"}
            </Badge>
          </div>
        </CardHeader>
        {source.errors.length > 0 && (
          <CardContent className="pt-0">
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {source.errors.length}
              {" "}
              source issue
              {source.errors.length === 1 ? "" : "s"}
            </div>
          </CardContent>
        )}
      </Card>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {files.map((file) => (
          <SourceFileCard key={file.id} sourceId={sourceId} file={file} />
        ))}
      </section>
    </div>
  );
}
