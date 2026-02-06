import { Link, useParams, useRouterState } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";

const PIPELINE_TABS = [
  { id: "overview", label: "Overview", to: "" },
  { id: "graph", label: "Graph", to: "/graph" },
  { id: "inspect", label: "Inspect", to: "/inspect" },
  { id: "executions", label: "Executions", to: "/executions" },
  { id: "code", label: "Code", to: "/code" },
] as const;

export function PipelineTabs() {
  const { id } = useParams({ from: "/pipelines/$id" });
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const getIsActive = (tabId: string) => {
    if (tabId === "overview") {
      return pathname === `/pipelines/${id}` || pathname === `/pipelines/${id}/`;
    }
    return pathname.includes(`/${tabId}`);
  };

  return (
    <nav
      className="px-6 pt-4 flex flex-wrap gap-1 border-b border-border"
      role="tablist"
      aria-label="Pipeline sections"
    >
      {PIPELINE_TABS.map((tab) => {
        const isActive = getIsActive(tab.id);

        return (
          <Link
            key={tab.id}
            to={`/pipelines/$id${tab.to}`}
            params={{
              id,
            }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            className={cn(
              "px-3 py-2 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-px",
              isActive
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
