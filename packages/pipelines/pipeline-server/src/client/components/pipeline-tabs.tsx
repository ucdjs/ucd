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
  const { sourceId, fileId, pipelineId } = useParams({ from: "/$sourceId/$fileId/$pipelineId" });
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const getIsActive = (tabId: string) => {
    if (tabId === "overview") {
      if (!fileId || !pipelineId) return false;
      return pathname === `/pipelines/${fileId}/${pipelineId}` || pathname === `/pipelines/${fileId}/${pipelineId}/`;
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
      {PIPELINE_TABS.map((tab) => {
        const isActive = getIsActive(tab.id);

        return (
          <Link
            key={tab.id}
            to={tab.to === "/graphs" ? "/$sourceId/$fileId/$pipelineId/graphs" : `/$sourceId/$fileId/$pipelineId${tab.to}`}
            params={{ sourceId, fileId, pipelineId }}
            role="tab"
            aria-selected={isActive}
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
