import { MinimalOutputCard } from "#components/inspect/cards/minimal-output-card";
import { getRouteApi } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { ArrowRight, ChevronDown, ChevronRight, FileOutput, FolderOutput, RouteIcon } from "lucide-react";
import { useState } from "react";

const InspectRoute = getRouteApi("/s/$sourceId/$sourceFileId/$pipelineId/inspect");

interface OutputItem {
  key: string;
  routeId: string;
  outputIndex: number;
  outputId: string;
  sink: string;
  path?: string;
  dynamicPath?: boolean;
  pathSource?: string;
  dir: string;
  fileName: string;
}

interface OutputsContentProps {
  outputs: OutputItem[];
  outputsByRoute: Map<string, OutputItem[]>;
  selectedOutput: OutputItem;
}

export function OutputsContent({ outputsByRoute, selectedOutput }: OutputsContentProps) {
  const navigate = InspectRoute.useNavigate();
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(() =>
    new Set([selectedOutput.routeId]),
  );

  function toggleRoute(routeId: string) {
    setExpandedRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
  }

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FolderOutput className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Pipeline outputs</h3>
        </div>
        <div className="rounded-lg border border-border/60">
          {Array.from(outputsByRoute.entries(), ([routeId, routeOutputs], groupIndex) => {
            const expanded = expandedRoutes.has(routeId);
            return (
              <div key={routeId} className={groupIndex > 0 ? "border-t border-border/60" : ""}>
                <Button
                  variant="ghost"
                  onClick={() => toggleRoute(routeId)}
                  className="flex h-auto w-full items-center gap-2 rounded-none px-3 py-2.5 text-left hover:bg-muted/30"
                >
                  {expanded
                    ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <RouteIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{routeId}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {routeOutputs.length}
                    {" "}
                    {routeOutputs.length === 1 ? "output" : "outputs"}
                  </span>
                </Button>
                {expanded && (
                  <div className="border-t border-border/40 bg-muted/5">
                    {routeOutputs.map((output) => {
                      const active = output.key === selectedOutput.key;
                      return (
                        <Button
                          key={output.key}
                          variant="ghost"
                          onClick={() => {
                            navigate({
                              search: (current) => ({
                                ...current,
                                route: output.routeId,
                                output: output.key,
                              }),
                            });
                          }}
                          className={`flex h-auto w-full items-center gap-2 rounded-none py-2 pl-10 pr-3 text-left ${active ? "bg-primary/5" : "hover:bg-muted/20"}`}
                        >
                          <FileOutput className={`h-3.5 w-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-xs font-medium">
                            Output
                            {" "}
                            {output.outputIndex + 1}
                          </span>
                          <span className="ml-auto truncate text-[11px] text-muted-foreground">
                            {output.outputId}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileOutput className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Output details</h3>
        </div>
        <MinimalOutputCard
          title={`Output ${selectedOutput.outputIndex + 1}`}
          output={selectedOutput}
          action={(
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                navigate({
                  search: (current) => ({
                    ...current,
                    route: selectedOutput.routeId,
                    view: undefined,
                    output: undefined,
                  }),
                });
              }}
            >
              Open
              {" "}
              {selectedOutput.routeId}
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        />
      </section>
    </>
  );
}
