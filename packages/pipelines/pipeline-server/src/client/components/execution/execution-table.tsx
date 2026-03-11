import type { ExecutionSummaryItem } from "#shared/schemas/execution";
import { StatusIcon } from "#components/execution/execution-status";
import { formatExecutionDuration, formatStartedAt } from "#lib/format";
import { Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ucdjs-internal/shared-ui/ui/table";
import { Play } from "lucide-react";

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
      <div className="text-center py-12">
        <Play className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">{emptyTitle}</p>
        {emptyDescription && (
          <p className="text-sm text-muted-foreground/70 mt-1">
            {emptyDescription}
          </p>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-25">Status</TableHead>
          <TableHead className="w-75">ID</TableHead>
          {showPipelineColumn && <TableHead>Pipeline</TableHead>}
          <TableHead>When</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Versions</TableHead>
          <TableHead>Routes</TableHead>
          <TableHead className="w-20"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {executions.map((execution) => {
          const routeSummary = execution.summary as { totalRoutes?: number; cached?: number } | null;
          const sourceId = execution.sourceId;
          const fileId = execution.fileId;
          const pipelineId = execution.pipelineId;
          const canView = sourceId != null && fileId != null && pipelineId != null;

          return (
            <TableRow key={execution.id} className="group">
              <TableCell>
                <div className="flex items-center gap-2">
                  <StatusIcon status={execution.status} />
                </div>
              </TableCell>
              <TableCell>
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                  {execution.id}
                </code>
              </TableCell>
              {showPipelineColumn && (
                <TableCell>
                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                    {pipelineId}
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
                      <div className="flex gap-1 flex-wrap">
                        {execution.versions.map((version) => (
                          <Badge key={version} variant="secondary" className="text-xs">
                            {version}
                          </Badge>
                        ))}
                      </div>
                    )
                  : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
              </TableCell>
              <TableCell>
                {routeSummary?.totalRoutes != null
                  ? (
                      <span className="text-sm">
                        {routeSummary.totalRoutes}
                        <span className="text-muted-foreground">
                          {" "}
                          (
                          {routeSummary.cached ?? 0}
                          {" "}
                          cached)
                        </span>
                      </span>
                    )
                  : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
              </TableCell>
              <TableCell>
                {canView
                  ? (
                      <div className="flex items-center gap-3">
                        <Link
                          to="/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId"
                          params={{
                            sourceId,
                            sourceFileId: fileId,
                            pipelineId,
                            executionId: execution.id,
                          }}
                          className="text-primary text-sm font-medium hover:underline"
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
                            className="text-primary text-sm font-medium hover:underline"
                          >
                            Graph
                          </Link>
                        )}
                      </div>
                    )
                  : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
