import { usePipelineRouteData } from "#hooks/use-pipeline-route-data";
import { getRouteApi, Link, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { FolderOutput, Workflow as PipelineIcon, Shuffle, Spline } from "lucide-react";
import { useState } from "react";
import { SidebarOutputsList } from "./list/sidebar-outputs-list";
import { SidebarRoutesList } from "./list/sidebar-routes-list";
import { SidebarTransformsList } from "./list/sidebar-transforms-list";

type TabId = "routes" | "transforms" | "outputs";

const tabs: {
  id: TabId;
  label: string;
  to:
    | "/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes"
    | "/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms"
    | "/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs";
  icon: typeof Spline;
}[] = [
  { id: "routes", label: "Routes", to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes", icon: Spline },
  { id: "transforms", label: "Transforms", to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms", icon: Shuffle },
  { id: "outputs", label: "Outputs", to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs", icon: FolderOutput },
];

export function InspectSidebar() {
  const routeParams = useParams({ from: "/s/$sourceId/$sourceFileId/$pipelineId" });
  const { pipeline } = usePipelineRouteData({
    fileId: routeParams.sourceFileId,
    pipelineId: routeParams.pipelineId,
    sourceId: routeParams.sourceId,
  });
  const params = useParams({ strict: false });
  const [filterValue, setFilterValue] = useState("");

  const activeTab: TabId = typeof params.transformName === "string"
    ? "transforms"
    : typeof params.outputKey === "string"
      ? "outputs"
      : "routes";

  const transformCount = new Set(pipeline!.routes.flatMap((r) => r.transforms)).size;
  const outputCount = pipeline!.routes.reduce((sum, r) => sum + r.outputs.length, 0);

  const counts: Record<TabId, number> = {
    routes: pipeline!.routes.length,
    transforms: transformCount,
    outputs: outputCount,
  };

  const searchPlaceholders: Record<TabId, string> = {
    routes: `Search ${pipeline!.routes.length} routes...`,
    transforms: `Search ${transformCount} transforms...`,
    outputs: `Search ${outputCount} outputs...`,
  };

  return (
    <Card>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted/10">
            <PipelineIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Inspect</div>
            <CardTitle className="text-base">Pipeline</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid grid-cols-3 gap-1 border-b border-border/60">
          {tabs.map((tab) => {
            return (
              <Link
                key={tab.id}
                to={tab.to}
                params={routeParams}
                onClick={() => setFilterValue("")}
                activeProps={{ className: "border-foreground text-foreground" }}
                className="inline-flex min-w-0 items-center justify-center gap-1 border-b-2 border-transparent px-2 pb-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:gap-1.5 sm:text-xs"
              >
                <tab.icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                <span className="truncate">{tab.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  (
                  {counts[tab.id]}
                  )
                </span>
              </Link>
            );
          })}
        </div>

        <Input
          value={filterValue}
          onChange={(event) => setFilterValue(event.target.value)}
          placeholder={searchPlaceholders[activeTab]}
          aria-label="Search inspect items"
        />

        <div className="rounded-xl border border-border/60">
          {activeTab === "routes" && (
            <SidebarRoutesList
              routes={pipeline!.routes}
              filter={filterValue}
              sourceId={routeParams.sourceId}
              sourceFileId={routeParams.sourceFileId}
              pipelineId={routeParams.pipelineId}
            />
          )}
          {activeTab === "transforms" && (
            <SidebarTransformsList
              routes={pipeline!.routes}
              filter={filterValue}
              sourceId={routeParams.sourceId}
              sourceFileId={routeParams.sourceFileId}
              pipelineId={routeParams.pipelineId}
            />
          )}
          {activeTab === "outputs" && (
            <SidebarOutputsList
              routes={pipeline!.routes}
              filter={filterValue}
              sourceId={routeParams.sourceId}
              sourceFileId={routeParams.sourceFileId}
              pipelineId={routeParams.pipelineId}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
