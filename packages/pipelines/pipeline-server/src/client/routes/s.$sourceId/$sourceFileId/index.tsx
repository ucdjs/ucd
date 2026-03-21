import { sourceQueryOptions } from "#queries/source";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { FileCode2, Layers3, Workflow as PipelineIcon } from "lucide-react";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId, sourceFileId } = Route.useParams();
  const { data: source } = useSuspenseQuery(sourceQueryOptions({ sourceId }));
  const file = source.files.find((file) => file.id === sourceFileId) ?? null;

  if (!file) {
    throw new Error(`File "${sourceFileId}" not found in source "${sourceId}"`);
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl border border-border bg-muted/20">
                <FileCode2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <CardTitle>{file.label}</CardTitle>
                <CardDescription>{source.label}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">
              <PipelineIcon className="h-3 w-3" />
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{pipeline.name || pipeline.id}</div>
                  <div className="text-xs text-muted-foreground">{pipeline.id}</div>
                </div>
                <PipelineIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Layers3 className="h-3 w-3" />
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
