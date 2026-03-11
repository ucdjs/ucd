import { useExecute } from "#hooks/use-execute";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowRight, Boxes, History, Loader2, Play, Route as RouteIcon } from "lucide-react";

interface QuickActionsCardProps {
  versions: string[];
}

export function QuickActionsCard({
  versions,
}: QuickActionsCardProps) {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const { execute, executing } = useExecute();
  const sourceId = "sourceId" in params && typeof params.sourceId === "string" ? params.sourceId : null;
  const sourceFileId = "sourceFileId" in params && typeof params.sourceFileId === "string" ? params.sourceFileId : null;
  const pipelineId = "pipelineId" in params && typeof params.pipelineId === "string" ? params.pipelineId : null;
  const canExecute = Boolean(sourceId && sourceFileId && pipelineId) && versions.length > 0;

  async function handleExecute() {
    if (!sourceId || !sourceFileId || !pipelineId || versions.length === 0) {
      return;
    }

    const result = await execute(sourceId, sourceFileId, pipelineId, versions);
    if (result.success && result.executionId) {
      navigate({
        to: "/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId",
        params: {
          sourceId,
          sourceFileId,
          pipelineId,
          executionId: result.executionId,
        },
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>
          Common tasks and navigation
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button
          className="justify-between"
          disabled={!canExecute || executing}
          onClick={handleExecute}
        >
          <span className="flex items-center gap-2">
            {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {executing ? "Running pipeline" : "Execute pipeline"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="justify-between"
          render={(props) => (
            <Link
              to="/s/$sourceId/$sourceFileId/$pipelineId/executions"
              params={{ sourceId: sourceId ?? "", sourceFileId: sourceFileId ?? "", pipelineId: pipelineId ?? "" }}
              {...props}
            >
              <span className="flex items-center gap-2">
                <History className="h-4 w-4" />
                View executions
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        />
        <Button
          variant="outline"
          className="justify-between"
          render={(props) => (
            <Link
              to="/s/$sourceId/$sourceFileId/$pipelineId/graphs"
              params={{ sourceId: sourceId ?? "", sourceFileId: sourceFileId ?? "", pipelineId: pipelineId ?? "" }}
              {...props}
            >
              <span className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Browse graphs
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        />
        <Button
          variant="outline"
          className="justify-between"
          render={(props) => (
            <Link
              to="/s/$sourceId/$sourceFileId/$pipelineId/inspect"
              params={{ sourceId: sourceId ?? "", sourceFileId: sourceFileId ?? "", pipelineId: pipelineId ?? "" }}
              {...props}
            >
              <span className="flex items-center gap-2">
                <RouteIcon className="h-4 w-4" />
                Inspect routes
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        />
      </CardContent>
    </Card>
  );
}
