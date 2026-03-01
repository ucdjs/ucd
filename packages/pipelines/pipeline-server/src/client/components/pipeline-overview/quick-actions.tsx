import { Link, useLoaderData, useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ucdjs-internal/shared-ui/ui/card";
import { useExecute, usePipelineVersions } from "@ucdjs/pipelines-ui";
import { ArrowRight, FileCode, Loader2, Play, Workflow } from "lucide-react";
import { useCallback } from "react";

export function QuickActionsPanel() {
  const { sourceId, fileId, pipelineId } = useParams({ from: "/$sourceId/$fileId/$pipelineId" });
  const { pipelineData } = useLoaderData({ from: "/$sourceId/$fileId/$pipelineId" });
  const pipeline = pipelineData?.pipeline;
  const navigate = useNavigate();
  const { execute, executing } = useExecute();
  const { selectedVersions } = usePipelineVersions(pipelineId, pipeline?.versions || [], `${fileId}:${pipelineId}`);
  const canExecute = selectedVersions.size > 0 && Boolean(pipeline);

  const handleExecute = useCallback(async () => {
    if (!canExecute) return;
    const result = await execute(fileId, pipelineId, Array.from(selectedVersions), sourceId);
    if (result.success && result.executionId) {
      navigate({
        to: "/$sourceId/$fileId/$pipelineId/executions/$executionId",
        params: { sourceId, fileId, pipelineId, executionId: result.executionId },
      });
    }
  }, [execute, sourceId, fileId, pipelineId, selectedVersions, canExecute, navigate]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Quick Actions</CardTitle>
        <CardDescription>
          Run, inspect, or view pipeline history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 grid grid-cols-2 gap-2">
        <Button
          className="w-full justify-between"
          disabled={!canExecute || executing}
          onClick={handleExecute}
        >
          <span className="flex items-center gap-2">
            {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {executing ? "Running" : "Execute pipeline"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          className="w-full justify-between"
          render={(props) => (
            <Link to="/$sourceId/$fileId/$pipelineId/executions" params={{ sourceId, fileId, pipelineId }} {...props}>
              <span className="flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                View executions
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        />

        <Button
          variant="outline"
          className="w-full justify-between"
          render={(props) => (
            <Link to="/$sourceId/$fileId/$pipelineId/graph" params={{ sourceId, fileId, pipelineId }} {...props}>
              <span className="flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                Open graph
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        />

        <Button
          variant="outline"
          className="w-full justify-between"
          render={(props) => (
            <Link to="/$sourceId/$fileId/$pipelineId/code" params={{ sourceId, fileId, pipelineId }} {...props}>
              <span className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Open code
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        />
      </CardContent>
    </Card>
  );
}
