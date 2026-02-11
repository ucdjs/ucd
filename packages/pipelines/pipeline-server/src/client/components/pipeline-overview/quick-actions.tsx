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
  const { file, id } = useParams({ from: "/pipelines/$file/$id" });
  const { pipeline } = useLoaderData({ from: "/pipelines/$file/$id" });
  const navigate = useNavigate();
  const { execute, executing } = useExecute();
  const { selectedVersions } = usePipelineVersions(id, pipeline?.versions || [], `${file}:${id}`);
  const canExecute = selectedVersions.size > 0 && Boolean(pipeline);

  const handleExecute = useCallback(async () => {
    if (!canExecute) return;
    const result = await execute(file, id, Array.from(selectedVersions));
    if (result.success && result.executionId) {
      navigate({
        to: "/pipelines/$file/$id/executions/$executionId",
        params: { file, id, executionId: result.executionId },
      });
    }
  }, [execute, file, id, selectedVersions, canExecute, navigate]);

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
            <Link to="/pipelines/$file/$id/executions" params={{ file, id }} {...props}>
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
            <Link to="/pipelines/$file/$id/graph" params={{ file, id }} {...props}>
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
            <Link to="/pipelines/$file/$id/code" params={{ file, id }} {...props}>
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
