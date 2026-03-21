import { Link, useParams } from "@tanstack/react-router";

const PIPELINE_TABS = [
  { id: "overview", label: "Overview", to: "" },
  { id: "inspect", label: "Inspect", to: "/inspect" },
  { id: "executions", label: "Executions", to: "/executions" },
] as const;

export function PipelineTabs() {
  const { sourceId, sourceFileId, pipelineId } = useParams({ from: "/s/$sourceId/$sourceFileId/$pipelineId" });

  return (
    <div className="overflow-x-auto border-y border-border/60 bg-background">
      <nav
        className="flex min-w-max gap-6 px-4 sm:px-6"
        role="tablist"
        aria-label="Pipeline sections"
      >
        {PIPELINE_TABS.map((tab) => (
          <Link
            key={tab.id}
            id={`tab-${tab.id}`}
            to={`/s/$sourceId/$sourceFileId/$pipelineId${tab.to}`}
            params={{ sourceId, sourceFileId, pipelineId }}
            role="tab"
            aria-controls={`tabpanel-${tab.id}`}
            activeProps={{
              className: "border-foreground bg-muted/40 text-foreground",
              "aria-selected": true,
            }}
            activeOptions={{
              exact: tab.id === "overview",
            }}
            className="inline-flex min-h-11 items-center rounded-t-md border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
