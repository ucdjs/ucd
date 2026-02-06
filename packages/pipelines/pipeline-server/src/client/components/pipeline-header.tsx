import { useLoaderData, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { useExecute, usePipelineVersions } from "@ucdjs/pipelines-ui";
import { Loader2, Play } from "lucide-react";
import { useCallback } from "react";

export function PipelineHeader() {
  const { id } = useParams({ from: "/pipelines/$id" });
  const data = useLoaderData({ from: "/pipelines/$id" });
  const pipeline = data.pipeline;
  const { execute, executing } = useExecute();
  const allVersions = pipeline?.versions ?? [];
  const { selectedVersions } = usePipelineVersions(id, allVersions);

  const canExecute = selectedVersions.size > 0;

  const handleExecute = useCallback(async () => {
    if (!canExecute) return;
    await execute(id, Array.from(selectedVersions));
  }, [execute, id, selectedVersions, canExecute]);

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
    </header>
  );
}
