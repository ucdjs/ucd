import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { sourceFileQueryOptions, sourceQueryOptions } from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId, sourceFileId } = Route.useParams();
  const { data: source } = useSuspenseQuery(sourceQueryOptions({ sourceId }));
  const { data: file } = useSuspenseQuery(sourceFileQueryOptions({ sourceId, fileId: sourceFileId }));

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{file.label}</CardTitle>
              <CardDescription>{source.label}</CardDescription>
            </div>
            <Badge variant="secondary">
              {file.pipelines.length}
              {" "}
              pipeline
              {file.pipelines.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <code className="text-xs text-muted-foreground break-all">{file.path}</code>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {file.pipelines.map((pipeline) => (
          <Link
            key={pipeline.id}
            to="/s/$sourceId/$sourceFileId/$pipelineId"
            params={{ sourceId, sourceFileId, pipelineId: pipeline.id }}
            className="rounded-lg border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40"
          >
            <div className="space-y-2">
              <div>
                <div className="font-medium">{pipeline.name || pipeline.id}</div>
                <div className="text-xs text-muted-foreground">{pipeline.id}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {pipeline.versions.length}
                {" "}
                version
                {pipeline.versions.length === 1 ? "" : "s"}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
