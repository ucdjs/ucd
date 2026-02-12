import { Link, useLoaderData, useNavigate, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { useExecute, usePipelineVersions } from "@ucdjs/pipelines-ui";
import { CheckCircle, Loader2, Play } from "lucide-react";
import { useCallback } from "react";

export function PipelineHeader() {
  const { file, id } = useParams({ from: "/pipelines/$file/$id" });
  const navigate = useNavigate();
  const data = useLoaderData({ from: "/pipelines/$file/$id" }) as { pipeline?: { versions: string[]; name?: string; id?: string; routeCount?: number; sourceCount?: number; description?: string } };
  const pipeline = data.pipeline;
  const { execute, executing, executionId } = useExecute();
  const allVersions = pipeline?.versions ?? [];
  const { selectedVersions } = usePipelineVersions(id, allVersions, `${file}:${id}`);

  const canExecute = selectedVersions.size > 0;

  const handleExecute = useCallback(async () => {
    if (!canExecute) return;
    const result = await execute(file, id, Array.from(selectedVersions));
    // Navigate to execution detail after successful execution
    if (result.success && result.executionId) {
      navigate({
        to: "/pipelines/$file/$id/executions/$executionId",
        params: { file, id, executionId: result.executionId },
      });
    }
  }, [execute, file, id, selectedVersions, canExecute, navigate]);

  return (
    <header className="px-6 py-4">
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="min-w-60 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 min-h-6">
            <h1 className="text-base font-semibold text-foreground tracking-tight">
              {pipeline?.name || pipeline?.id || "The cake is a lie"}
            </h1>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline?.versions.length ?? 0}
              {" "}
              versions
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline?.routeCount ?? 0}
              {" "}
              routes
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {pipeline?.sourceCount ?? 0}
              {" "}
              sources
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl h-4 overflow-hidden">
            {pipeline?.description ?? "No description provided."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {executionId && !executing && (
            <Button
              variant="outline"
              size="sm"
              render={(props) => (
                <Link
                  to="/pipelines/$file/$id/executions/$executionId"
                  params={{ file, id, executionId }}
                  {...props}
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  View Execution
                </Link>
              )}
            />
          )}
          <Button
            size="sm"
            disabled={!canExecute || executing || !pipeline}
            onClick={handleExecute}
          >
            {executing
              ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                )
              : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </>
                )}
          </Button>
        </div>
      </div>
    </header>
  );
}
