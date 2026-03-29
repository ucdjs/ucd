import type { PipelineDetails } from "#shared/schemas/pipeline";
import { Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { SIDEBAR_ACTIVE_LINK_CLASS } from "./sidebar-shared";

interface RoutesListProps {
  routes: PipelineDetails["routes"];
  filter: string;
  sourceId: string;
  sourceFileId: string;
  pipelineId: string;
}

export function SidebarRoutesList({ routes, filter, sourceId, sourceFileId, pipelineId }: RoutesListProps) {
  const normalizedFilter = filter.trim().toLowerCase();
  const filtered = normalizedFilter
    ? routes.filter((route) => {
        if (route.id.toLowerCase().includes(normalizedFilter)) return true;
        if (route.transforms.some((t) => t.toLowerCase().includes(normalizedFilter))) return true;
        if (route.outputs.some((o) =>
          (o.dir ?? "").toLowerCase().includes(normalizedFilter)
          || (o.fileName ?? "").toLowerCase().includes(normalizedFilter),
        )) return true;
        return route.depends.some((d) => d.routeId.toLowerCase().includes(normalizedFilter));
      })
    : routes;

  if (filtered.length === 0) {
    return <div className="px-4 py-10 text-sm text-muted-foreground">No routes match the current filter.</div>;
  }

  return (
    <div className="divide-y divide-border/60">
      {filtered.map((route) => (
        <Link
          key={route.id}
          to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/routes/$routeId"
          params={{ sourceId, sourceFileId, pipelineId, routeId: route.id }}
          className={`flex w-full flex-col gap-2 px-4 py-3 text-left ${SIDEBAR_ACTIVE_LINK_CLASS}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{route.id}</div>
            </div>
            {route.cache && <Badge variant="secondary" className="text-[10px]">Cacheable</Badge>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span>
              <span className="font-medium tabular-nums text-foreground/70">{route.depends.length}</span>
              {" "}
              depends
            </span>
            <span>
              <span className="font-medium tabular-nums text-foreground/70">{route.transforms.length}</span>
              {" "}
              transforms
            </span>
            <span>
              <span className="font-medium tabular-nums text-foreground/70">{route.outputs.length}</span>
              {" "}
              outputs
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
