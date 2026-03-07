import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { sourceFileQueryOptions, sourceQueryOptions } from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/s/$sourceId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId } = Route.useParams();
  const { data } = useSuspenseQuery(sourceQueryOptions({ sourceId }));
  const fileQueries = useQueries({
    queries: data.files.map((file) => sourceFileQueryOptions({ sourceId, fileId: file.id })),
  });
  const files = data.files.map((file) => ({
    ...file,
    pipelines: fileQueries.find((query) => query.data?.id === file.id)?.data?.pipelines ?? [],
  }));

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{data.label}</CardTitle>
              <CardDescription>{data.type}</CardDescription>
            </div>
            <Badge variant="secondary">
              {files.length}
              {" "}
              {files.length === 1 ? "file" : "files"}
            </Badge>
          </div>
        </CardHeader>
        {data.errors.length > 0 && (
          <CardContent className="pt-0">
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {data.errors.length}
              {" "}
              source issue
              {data.errors.length === 1 ? "" : "s"}
            </div>
          </CardContent>
        )}
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => (
          <Link
            key={file.id}
            to="/s/$sourceId/$sourceFileId"
            params={{ sourceId, sourceFileId: file.id }}
            className="rounded-lg border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40"
          >
            <div className="space-y-2">
              <div>
                <div className="font-medium">{file.label}</div>
                <div className="text-xs text-muted-foreground break-all">{file.path}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {file.pipelines.length}
                {" "}
                pipeline
                {file.pipelines.length === 1 ? "" : "s"}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
