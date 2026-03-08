import type { OverviewResponse, SourceSummary } from "@ucdjs/pipelines-ui/functions";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { ExecutionActivityChart } from "./overview/activity-chart";
import { RecentExecutionsPanel } from "./overview/recent-executions-panel";
import { SourcesPanel } from "./overview/sources-panel";
import { StatusOverviewPanel } from "./overview/status-overview-panel";

interface DashboardHomeProps {
  dashboard: OverviewResponse;
  sources: SourceSummary[];
  workspaceId?: string;
  version?: string;
}

export function DashboardHome({
  dashboard,
  sources,
  workspaceId,
  version,
}: DashboardHomeProps) {
  const sourceCount = sources.length;
  const pipelineCount = sources.reduce((sum, source) => sum + source.pipelineCount, 0);
  const fileCount = sources.reduce((sum, source) => sum + source.fileCount, 0);

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="grid w-full gap-4 p-6">
        <div className="flex flex-col gap-3 border-b border-border/60 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {workspaceId && <Badge variant="secondary">{workspaceId}</Badge>}
              {version && <Badge variant="outline">{version}</Badge>}
              <span>Last 7 days</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Pipeline dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">
              {sourceCount}
              {" "}
              sources
            </Badge>
            <Badge variant="outline">
              {fileCount}
              {" "}
              files
            </Badge>
            <Badge variant="outline">
              {pipelineCount}
              {" "}
              pipelines
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <ExecutionActivityChart
            activity={dashboard.activity}
            summaryStates={dashboard.summary.states}
          />
          <StatusOverviewPanel
            summaryStates={dashboard.summary.states}
            total={dashboard.summary.total}
          />
          <RecentExecutionsPanel executions={dashboard.recentExecutions} />
          <SourcesPanel sources={sources} />
        </div>
      </div>
    </div>
  );
}
