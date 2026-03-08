import type { SourceSummary } from "@ucdjs/pipelines-ui/functions";
import { Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { FolderKanban } from "lucide-react";

interface SourcesPanelProps {
  sources: SourceSummary[];
}

export function SourcesPanel({
  sources,
}: SourcesPanelProps) {
  const sourcesWithIssues = sources.filter((source) => source.errors.length > 0).length;
  const totalIssues = sources.reduce((sum, source) => sum + source.errors.length, 0);

  return (
    <Card className="xl:col-span-4 xl:self-start">
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Sources</CardTitle>
            <CardDescription>Configured source trees and current health.</CardDescription>
          </div>
          {totalIssues > 0 && (
            <Badge variant="outline" className="text-red-600 dark:text-red-400">
              {totalIssues}
              {" "}
              issues
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1 border border-border/60 bg-muted/10 p-3">
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Healthy</div>
            <div className="text-xl font-semibold tabular-nums">{sources.length - sourcesWithIssues}</div>
          </div>
          <div className="grid gap-1 border border-border/60 bg-muted/10 p-3">
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">With issues</div>
            <div className="text-xl font-semibold tabular-nums">{sourcesWithIssues}</div>
          </div>
        </div>

        {sources.length === 0
          ? (
              <div className="rounded-md border border-dashed border-border/70 bg-muted/10 px-4 py-8 text-center">
                <FolderKanban className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">No sources configured</p>
              </div>
            )
          : (
              <div className="divide-y divide-border/60 border border-border/60">
                {sources.map((source) => {
                  const statusClass = source.errors.length > 0 ? "bg-red-500/85" : "bg-emerald-500/85";

                  return (
                    <Link
                      key={source.id}
                      to="/s/$sourceId"
                      params={{ sourceId: source.id }}
                      className="grid gap-2 px-3 py-3 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusClass}`} />
                          <span className="truncate text-sm font-medium">{source.label}</span>
                        </div>
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {source.type}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {source.fileCount}
                          {" "}
                          files
                        </span>
                        <span>•</span>
                        <span>
                          {source.pipelineCount}
                          {" "}
                          pipelines
                        </span>
                        {source.errors.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 dark:text-red-400">
                              {source.errors.length}
                              {" "}
                              issues
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
      </CardContent>
    </Card>
  );
}
