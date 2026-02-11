import { fetchExecutions } from "#lib/pipeline-executions";
import { Link, useParams, useRouterState } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { useEffect, useMemo, useState } from "react";

const PIPELINE_TABS = [
  { id: "overview", label: "Overview", to: "" },
  { id: "inspect", label: "Inspect", to: "/inspect" },
  { id: "executions", label: "Executions", to: "/executions" },
  { id: "graphs", label: "Graphs", to: "/graphs" },
  { id: "code", label: "Code", to: "/code" },
] as const;

export function PipelineTabs() {
  const { file, id } = useParams({ from: "/pipelines/$file/$id" });
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [hasGraphs, setHasGraphs] = useState(false);

  useEffect(() => {
    if (!file || !id) return;

    let cancelled = false;
    fetchExecutions(file, id, { limit: 50 })
      .then((data) => {
        if (cancelled) return;
        setHasGraphs(data.executions.some((execution) => execution.hasGraph));
      })
      .catch(() => {
        if (cancelled) return;
        setHasGraphs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file, id]);

  const tabs = useMemo(
    () => PIPELINE_TABS.filter((tab) => (tab.id === "graphs" ? hasGraphs : true)),
    [hasGraphs],
  );

  const getIsActive = (tabId: string) => {
    if (tabId === "overview") {
      if (!file || !id) return false;
      return pathname === `/pipelines/${file}/${id}` || pathname === `/pipelines/${file}/${id}/`;
    }

    if (tabId === "graphs") {
      return pathname.includes("/graphs");
    }

    return pathname.includes(`/${tabId}`) || pathname.endsWith(`/${tabId}`);
  };

  return (
    <nav
      className="px-6 pt-4 flex flex-wrap gap-1 border-b border-border"
      role="tablist"
      aria-label="Pipeline sections"
    >
      {tabs.map((tab) => {
        const isActive = getIsActive(tab.id);

        return (
          <Link
            key={tab.id}
            to={tab.to === "/graphs" ? "/pipelines/$file/$id/graphs" : `/pipelines/$file/$id${tab.to}`}
            params={{ file, id }}
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
