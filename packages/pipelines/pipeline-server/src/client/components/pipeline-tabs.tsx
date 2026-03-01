import { Link, useParams } from "@tanstack/react-router";

const PIPELINE_TABS = [
  { id: "overview", label: "Overview", to: "" },
  { id: "inspect", label: "Inspect", to: "/inspect" },
  { id: "executions", label: "Executions", to: "/executions" },
  { id: "graphs", label: "Graphs", to: "/graphs" },
  { id: "code", label: "Code", to: "/code" },
] as const;

export function PipelineTabs() {
  const { sourceId, fileId, pipelineId } = useParams({ from: "/$sourceId/$fileId/$pipelineId" });

  return (
    <nav
      className="px-6 pt-4 flex flex-wrap gap-1 border-b border-border"
      role="tablist"
      aria-label="Pipeline sections"
    >
      {PIPELINE_TABS.map((tab) => {
        return (
          <Link
            key={tab.id}
            to={tab.to === "/graphs" ? "/$sourceId/$fileId/$pipelineId/graphs" : `/$sourceId/$fileId/$pipelineId${tab.to}`}
            params={{ sourceId, fileId, pipelineId }}
            role="tab"
            aria-controls={`tabpanel-${tab.id}`}
            activeProps={{ className: "border-primary text-primary bg-primary/5" }}
            activeOptions={{
              exact: true,
            }}
            className="px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
