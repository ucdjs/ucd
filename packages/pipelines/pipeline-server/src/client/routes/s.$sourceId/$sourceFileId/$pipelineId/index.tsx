import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { pipelineQueryOptions } from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/s/$sourceId/$sourceFileId/$pipelineId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sourceId, sourceFileId, pipelineId } = Route.useParams();
  const { data } = useSuspenseQuery(pipelineQueryOptions({ sourceId, fileId: sourceFileId, pipelineId }));
  const pipeline = data.pipeline;

  return (
    <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview" className="p-6">
      <div className="grid gap-6 items-start lg:auto-rows-min lg:grid-cols-[minmax(420px,1fr)_minmax(240px,0.6fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline details</CardTitle>
              <CardDescription>{pipeline.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {pipeline.description ?? "No description provided."}
              </p>
              <div className="flex flex-wrap gap-2">
                {pipeline.versions.map((version) => (
                  <Badge key={version} variant="secondary">{version}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Route overview</CardTitle>
              <CardDescription>
                {pipeline.routes.length}
                {" "}
                routes configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pipeline.routes.slice(0, 6).map((route) => (
                <div key={route.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{route.id}</span>
                    {route.cache
                      ? <Badge variant="secondary">cache</Badge>
                      : <Badge variant="outline">live</Badge>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:row-span-2 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Sources</CardTitle>
              <CardDescription>
                {pipeline.sources.length}
                {" "}
                linked source
                {pipeline.sources.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pipeline.sources.map((source) => (
                <div key={source.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <code>{source.id}</code>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
