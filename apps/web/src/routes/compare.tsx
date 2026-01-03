import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { compareVersionsQueryOptions } from "@/functions/store";
import { versionsQueryOptions } from "@/functions/versions";

export const Route = createFileRoute("/compare")({
  component: ComparePage,
});

function ComparePage() {
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const [from, setFrom] = useState<string>(versions?.[1]?.version ?? "");
  const [to, setTo] = useState<string>(versions?.[0]?.version ?? "");
  const [shouldCompare, setShouldCompare] = useState(false);

  const compareQuery = useQuery({
    ...compareVersionsQueryOptions({ from, to, includeFileHashes: true }),
    enabled: shouldCompare && from !== to && !!from && !!to,
  });

  const comparison = compareQuery.data;

  function handleCompare() {
    if (from && to && from !== to) {
      setShouldCompare(true);
    }
  }

  function swapVersions() {
    const temp = from;
    setFrom(to);
    setTo(temp);
    setShouldCompare(false);
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/">Home</Link>} />
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Compare Versions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Compare Unicode Versions</h1>
          <p className="text-sm text-muted-foreground">
            Compare files between two Unicode versions to see what changed.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Versions</CardTitle>
            <CardDescription>
              Choose two Unicode versions to compare their files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">From</label>
                <select
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setShouldCompare(false);
                  }}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      {v.version}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={swapVersions}
                className="mt-5"
                title="Swap versions"
              >
                <ArrowRight className="size-4" />
              </Button>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <select
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setShouldCompare(false);
                  }}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      {v.version}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleCompare}
                disabled={!from || !to || from === to || compareQuery.isFetching}
                className="mt-5"
              >
                {compareQuery.isFetching && <Loader2 className="mr-2 size-4 animate-spin" />}
                Compare
              </Button>
            </div>

            {from === to && from && (
              <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                Please select two different versions to compare.
              </p>
            )}
          </CardContent>
        </Card>

        {compareQuery.isError && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {compareQuery.error?.message ?? "Failed to compare versions"}
              </p>
            </CardContent>
          </Card>
        )}

        {comparison && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                label="Added"
                value={comparison.added.length}
                icon={<Plus className="size-4 text-green-600" />}
                className="border-green-200 dark:border-green-900"
              />
              <StatCard
                label="Removed"
                value={comparison.removed.length}
                icon={<Minus className="size-4 text-red-600" />}
                className="border-red-200 dark:border-red-900"
              />
              <StatCard
                label="Modified"
                value={comparison.modified.length}
                icon={<FileText className="size-4 text-amber-600" />}
                className="border-amber-200 dark:border-amber-900"
              />
              <StatCard
                label="Unchanged"
                value={comparison.unchanged}
                icon={<FileText className="size-4 text-muted-foreground" />}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {comparison.added.length > 0 && (
                <FileListCard
                  title="Added Files"
                  files={comparison.added}
                  variant="added"
                />
              )}
              {comparison.removed.length > 0 && (
                <FileListCard
                  title="Removed Files"
                  files={comparison.removed}
                  variant="removed"
                />
              )}
              {comparison.modified.length > 0 && (
                <FileListCard
                  title="Modified Files"
                  files={comparison.modified}
                  variant="modified"
                  changes={comparison.changes}
                />
              )}
            </div>

            {comparison.added.length === 0
              && comparison.removed.length === 0
              && comparison.modified.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No differences found between
                    {" "}
                    {comparison.from}
                    {" "}
                    and
                    {" "}
                    {comparison.to}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-3 p-4">
        {icon}
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const clampedI = Math.max(0, Math.min(i, sizes.length - 1));
  const value = bytes / (1024 ** clampedI);
  return `${value.toFixed(1)} ${sizes[clampedI]}`;
}

interface FileChange {
  file: string;
  from: { size: number };
  to: { size: number };
}

function FileListCard({
  title,
  files,
  variant,
  changes,
}: {
  title: string;
  files: readonly string[];
  variant: "added" | "removed" | "modified";
  changes?: readonly FileChange[];
}) {
  const colors = {
    added: "text-green-600 dark:text-green-400",
    removed: "text-red-600 dark:text-red-400",
    modified: "text-amber-600 dark:text-amber-400",
  };

  const changesMap = new Map(changes?.map((c) => [c.file, c]) ?? []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {files.length}
          {" "}
          file(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto">
          <ul className="space-y-1.5">
            {files.map((file) => {
              const change = changesMap.get(file);
              return (
                <li key={file} className={`font-mono text-xs ${colors[variant]}`}>
                  <span>{file}</span>
                  {change && (
                    <span className="ml-2 text-muted-foreground">
                      (
                      {formatBytes(change.from.size)}
                      {" "}
                      →
                      {" "}
                      {formatBytes(change.to.size)}
                      )
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
