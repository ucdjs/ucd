import { ExplorerBreadcrumbsBase } from "#components/explorer/explorer-breadcrumbs-base";
import { Link, useChildMatches, useSearch } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export function ReportsExplorerBreadcrumbs() {
  const [childMatch] = useChildMatches();
  const params = (childMatch?.params as { id?: string; rev?: string } | undefined) ?? {};
  const search = useSearch({ strict: false }) as { rev?: string };
  const reportId = typeof params.id === "string" ? params.id : "";
  const revId = typeof search.rev === "string"
    ? search.rev
    : typeof params.rev === "string"
      ? params.rev
      : "";
  const segments = [];

  if (reportId) {
    segments.push({
      key: reportId,
      label: reportId,
      current: !revId,
      render: revId ? <Link to="/reports/$id" params={{ id: reportId }} /> : undefined,
    });
  }

  if (revId) {
    segments.push({
      key: "rev",
      label: "rev",
      current: true,
    });
    segments.push({
      key: revId,
      label: revId,
      current: true,
    });
  }

  return (
    <ExplorerBreadcrumbsBase
      rootLabel="Reports"
      rootIcon={<FileText className="size-3.5 text-amber-500" />}
      isRoot={!reportId}
      rootRender={<Link to="/reports" />}
      segments={segments}
    />
  );
}
