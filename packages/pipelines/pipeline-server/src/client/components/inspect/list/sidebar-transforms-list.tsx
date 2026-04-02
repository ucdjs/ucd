import type { PipelineDetails } from "#shared/schemas/pipeline";
import { Link } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/components";
import { Shuffle } from "lucide-react";
import { deriveTransforms, SIDEBAR_ACTIVE_LINK_CLASS } from "./sidebar-shared";

interface TransformsListProps {
  routes: PipelineDetails["routes"];
  filter: string;
  sourceId: string;
  sourceFileId: string;
  pipelineId: string;
}

export function SidebarTransformsList({ routes, filter, sourceId, sourceFileId, pipelineId }: TransformsListProps) {
  const transforms = deriveTransforms(routes);
  const normalizedFilter = filter.trim().toLowerCase();
  const filtered = normalizedFilter
    ? transforms.filter((t) => t.name.toLowerCase().includes(normalizedFilter))
    : transforms;

  if (filtered.length === 0) {
    return <div className="px-4 py-10 text-sm text-muted-foreground">No transforms match the current filter.</div>;
  }

  return (
    <div className="divide-y divide-border/60">
      {filtered.map((transform) => (
        <Link
          key={transform.name}
          to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms/$transformName"
          params={{ sourceId, sourceFileId, pipelineId, transformName: transform.name }}
          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${SIDEBAR_ACTIVE_LINK_CLASS}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Shuffle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="truncate text-sm font-medium text-foreground">{transform.name}</div>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {transform.routes.length}
            {" "}
            {transform.routes.length === 1 ? "route" : "routes"}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
