import { Await, createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { ArrowLeft, FileCode, History, Loader2 } from "lucide-react";
import { Suspense } from "react";

export const Route = createFileRoute("/$sourceId/$fileId/$pipelineId/")({
  component: PipelinePage,
});

function PipelinePage() {
  const { sourceId, fileId, pipelineId, pipeline, code, executions } = useLoaderData({
    from: "/$sourceId/$fileId/$pipelineId",
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/$sourceId/$fileId"
          params={{ sourceId, fileId }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to file
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-linear-to-br from-muted/50 via-muted/10 to-transparent p-4">
        <h1 className="text-lg font-semibold text-foreground">
          {pipeline.name || pipeline.id}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">{pipeline.id}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {pipeline.versions.length}
            {" "}
            versions
          </span>
          <span>
            {pipeline.routeCount}
            {" "}
            routes
          </span>
          <span>
            {pipeline.sourceCount}
            {" "}
            sources
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Code (Deferred) */}
        <div className="rounded-lg border border-border">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Code</span>
          </div>
          <div className="p-4">
            <Suspense
              fallback={(
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading code...
                </div>
              )}
            >
              <Await promise={code}>
                {(codeContent) => (
                  <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-[400px]">
                    <code>{codeContent || "No code available"}</code>
                  </pre>
                )}
              </Await>
            </Suspense>
          </div>
        </div>

        {/* Recent Executions (Deferred) */}
        <div className="rounded-lg border border-border">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Recent Executions</span>
          </div>
          <div className="p-4">
            <Suspense
              fallback={(
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading executions...
                </div>
              )}
            >
              <Await promise={executions}>
                {(executionsList) => (
                  <div>
                    {executionsList && executionsList.length > 0
                      ? (
                          <div className="space-y-2">
                            {executionsList.map((execution: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 rounded bg-muted/50"
                              >
                                <span className="text-xs">
                                  Execution
                                  {index + 1}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {execution.status || "unknown"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No executions yet
                          </p>
                        )}
                  </div>
                )}
              </Await>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
