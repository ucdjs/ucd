import type { PipelineDetails } from "#shared/schemas/pipeline";
import { Link } from "@tanstack/react-router";
import { deriveOutputs, SIDEBAR_ACTIVE_LINK_CLASS } from "./sidebar-shared";

interface OutputsListProps {
  routes: PipelineDetails["routes"];
  filter: string;
  sourceId: string;
  sourceFileId: string;
  pipelineId: string;
}

export function SidebarOutputsList({ routes, filter, sourceId, sourceFileId, pipelineId }: OutputsListProps) {
  const outputs = deriveOutputs(routes);
  const normalizedFilter = filter.trim().toLowerCase();
  const filtered = normalizedFilter
    ? outputs.filter((o) =>
        o.dir.toLowerCase().includes(normalizedFilter)
        || o.fileName.toLowerCase().includes(normalizedFilter)
        || o.routeId.toLowerCase().includes(normalizedFilter),
      )
    : outputs;

  if (filtered.length === 0) {
    return <div className="px-4 py-10 text-sm text-muted-foreground">No outputs match the current filter.</div>;
  }

  return (
    <div className="divide-y divide-border/60">
      {filtered.map((output) => (
        <Link
          key={output.key}
          to="/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs/$outputKey"
          params={{ sourceId, sourceFileId, pipelineId, outputKey: output.key }}
          className={`flex w-full flex-col gap-1 px-4 py-3 text-left ${SIDEBAR_ACTIVE_LINK_CLASS}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{output.routeId}</span>
            <span className="truncate text-sm font-semibold text-foreground">
              output
              {output.outputIndex + 1}
            </span>
          </div>
          <div className="truncate text-[11px] text-muted-foreground">{output.dir}</div>
          <div className="truncate text-[11px] text-muted-foreground">{output.fileName}</div>
        </Link>
      ))}
    </div>
  );
}
