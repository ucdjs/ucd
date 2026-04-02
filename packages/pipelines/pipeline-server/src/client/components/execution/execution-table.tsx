import type { ExecutionSummaryItem } from "#shared/schemas/execution";
import { StatusIcon } from "#components/execution/status-icon";
import { formatExecutionDuration, formatStartedAt } from "#lib/format";
import { Link } from "@tanstack/react-router";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ucdjs-internal/shared-ui/components";
import { ChartSpline, Play } from "lucide-react";

interface ExecutionTableProps {
  executions: ExecutionSummaryItem[];
  emptyTitle: string;
  emptyDescription?: string;
  showPipelineColumn?: boolean;
  showGraphLink?: boolean;
}

export function ExecutionTable({
  executions,
  emptyTitle,
  emptyDescription,
  showPipelineColumn = false,
  showGraphLink = false,
}: ExecutionTableProps) {
  if (executions.length === 0) {
    return (
      <div className="py-12 text-center">
        <Play className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">{emptyTitle}</p>
        {emptyDescription && (
          <p className="mt-1 text-sm text-muted-foreground/70">
            {emptyDescription}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        {executions.map((execution) => {
          const canView = execution.sourceId != null && execution.fileId != null && execution.pipelineId != null;

          return (
            <div key={execution.id} className="rounded-lg border border-border/70 bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={execution.status} />
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{execution.id}</code>
                  </div>
                  {showPipelineColumn && (
                    <div className="text-xs text-muted-foreground">{execution.pipelineId}</div>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{formatStartedAt(execution.startedAt)}</div>
                  <div>{formatExecutionDuration(execution.startedAt, execution.completedAt)}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {execution.versions
                  ? execution.versions.map((version) => (
                      <Badge key={version} variant="secondary" className="text-xs">
                        {version}
                      </Badge>
                    ))
                  : <span className="text-sm text-muted-foreground">-</span>}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {execution.summary
                    ? `${execution.summary.totalRoutes} routes · ${execution.summary.cached} cached`
                    : "-"}
                </span>
                {canView
                  ? (
                      <ExecutionTableActions
                        execution={execution}
                        sourceId={execution.sourceId!}
                        fileId={execution.fileId!}
                        pipelineId={execution.pipelineId}
                        showGraphLink={showGraphLink}
                      />
                    )
                  : <span className="text-sm text-muted-foreground">-</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Status</TableHead>
              <TableHead className="min-w-52">Execution</TableHead>
              {showPipelineColumn && <TableHead className="min-w-36">Pipeline</TableHead>}
              <TableHead className="min-w-28">When</TableHead>
              <TableHead className="min-w-24">Duration</TableHead>
              <TableHead className="min-w-40">Versions</TableHead>
              <TableHead className="min-w-36">Summary</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.map((execution) => {
              const canView = execution.sourceId != null && execution.fileId != null && execution.pipelineId != null;

              return (
                <TableRow key={execution.id} className="align-top">
                  <TableCell>
                    <StatusIcon status={execution.status} />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <code className="inline-flex rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {execution.id}
                      </code>
                      <div className="flex flex-wrap gap-1.5">
                        {execution.versions
                          ? execution.versions.map((version) => (
                              <Badge key={version} variant="secondary" className="text-xs">
                                {version}
                              </Badge>
                            ))
                          : <span className="text-sm text-muted-foreground">-</span>}
                      </div>
                    </div>
                  </TableCell>
                  {showPipelineColumn && (
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {execution.pipelineId}
                      </code>
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {formatStartedAt(execution.startedAt)}
                  </TableCell>
                  <TableCell>
                    {formatExecutionDuration(execution.startedAt, execution.completedAt)}
                  </TableCell>
                  <TableCell>
                    {execution.versions
                      ? (
                          <div className="flex flex-wrap gap-1.5">
                            {execution.versions.map((version) => (
                              <Badge key={version} variant="secondary" className="text-xs">
                                {version}
                              </Badge>
                            ))}
                          </div>
                        )
                      : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                  </TableCell>
                  <TableCell>
                    {execution.summary
                      ? (
                          <div className="text-sm">
                            <div>
                              {execution.summary.totalRoutes}
                              {" "}
                              routes
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {execution.summary.cached}
                              {" "}
                              cached ·
                              {" "}
                              {execution.summary.totalOutputs}
                              {" "}
                              outputs
                            </div>
                          </div>
                        )
                      : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                  </TableCell>
                  <TableCell>
                    {canView
                      ? (
                          <div className="flex justify-end">
                            <ExecutionTableActions
                              execution={execution}
                              sourceId={execution.sourceId!}
                              fileId={execution.fileId!}
                              pipelineId={execution.pipelineId}
                              showGraphLink={showGraphLink}
                              alignEnd
                            />
                          </div>
                        )
                      : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ExecutionTableActions({
  execution,
  sourceId,
  fileId,
  pipelineId,
  showGraphLink,
  alignEnd = false,
}: {
  execution: ExecutionSummaryItem;
  sourceId: string;
  fileId: string;
  pipelineId: string;
  showGraphLink: boolean;
  alignEnd?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${alignEnd ? "justify-end" : ""}`}>
      <Link
        to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId"
        params={{
          sourceId,
          sourceFileId: fileId,
          pipelineId,
          executionId: execution.id,
        }}
        className="text-sm font-medium text-primary hover:underline"
      >
        View
      </Link>
      {showGraphLink && execution.hasGraph && (
        <Link
          to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId/graph"
          params={{
            sourceId,
            sourceFileId: fileId,
            pipelineId,
            executionId: execution.id,
          }}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ChartSpline className="h-3.5 w-3.5" />
          View graph
        </Link>
      )}
    </div>
  );
}
