import type { SourceResponse } from "#shared/schemas/source";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ucdjs-internal/shared-ui/ui/dialog";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { AlertTriangle, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

type SourceIssue = SourceResponse["errors"][number];

interface SourceIssuesDialogProps {
  issues: SourceIssue[];
  title: string;
  description?: string;
}

export function SourceIssuesDialog({
  issues,
  title,
  description,
}: SourceIssuesDialogProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const groups = (() => {
    const nextGroups = new Map<string, SourceIssue[]>();
    const normalizedFilter = filter.trim().toLowerCase();

    for (const issue of issues) {
      const key = issue.relativePath ?? issue.filePath ?? "Unknown file";
      const matchesFilter = normalizedFilter.length === 0
        || key.toLowerCase().includes(normalizedFilter)
        || issue.message.toLowerCase().includes(normalizedFilter)
        || issue.code.toLowerCase().includes(normalizedFilter)
        || issue.scope.toLowerCase().includes(normalizedFilter)
        || (issue.meta ? JSON.stringify(issue.meta).toLowerCase().includes(normalizedFilter) : false);

      if (!matchesFilter) {
        continue;
      }

      const group = nextGroups.get(key);
      if (group) {
        group.push(issue);
      } else {
        nextGroups.set(key, [issue]);
      }
    }

    return [...nextGroups.entries()];
  })();

  function toggleGroup(path: string) {
    setCollapsedGroups((current) => ({
      ...current,
      [path]: !current[path],
    }));
  }

  const visibleIssueCount = groups.reduce((count, [, groupedIssues]) => count + groupedIssues.length, 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setFilter("");
          setCollapsedGroups({});
        }
      }}
    >
      <DialogTrigger
        render={(
          <Button
            variant="outline"
          />
        )}
      >
        View details
      </DialogTrigger>
      <DialogContent
        className="grid-rows-[auto_auto_minmax(0,1fr)_auto] h-[90vh] w-6xl! max-w-[calc(100vw-2rem)]! overflow-hidden p-0"
        data-testid="source-issues-dialog"
        showCloseButton
      >
        <DialogHeader className="border-b border-border/60 px-5 pt-5 pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? `Inspect ${issues.length} recorded source issue${issues.length === 1 ? "" : "s"}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter issues"
                aria-label="Filter issues"
                className="h-8 pl-8 text-sm"
              />
            </div>
            <div className="shrink-0 text-xs text-muted-foreground">
              {visibleIssueCount}
              {" / "}
              {issues.length}
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-4">
          <div className="grid gap-4">
            {groups.length === 0 && (
              <div className="rounded-md border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
                No issues match the current filter.
              </div>
            )}
            {groups.map(([path, groupedIssues]) => {
              const collapsed = collapsedGroups[path] === true;

              return (
                <section key={path} className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => toggleGroup(path)}
                    className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-muted/35"
                  >
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">File</div>
                      <code className="mt-1 block break-all text-xs text-foreground">{path}</code>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                      <span>
                        {groupedIssues.length}
                        {" "}
                        issue
                        {groupedIssues.length === 1 ? "" : "s"}
                      </span>
                      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {!collapsed && (
                    <div className="grid gap-3">
                      {groupedIssues.map((issue) => (
                        <div
                          key={`${path}:${issue.code}:${issue.message}:${issue.scope}`}
                          className="rounded-lg border border-destructive/20 bg-destructive/5 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                            <div className="min-w-0 flex-1 space-y-3">
                              <p className="text-sm font-medium text-foreground">{issue.message}</p>

                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="rounded-md border border-border/70 bg-background px-2 py-1 text-muted-foreground">
                                  code:
                                  {" "}
                                  <span className="text-foreground">{issue.code}</span>
                                </span>
                                <span className="rounded-md border border-border/70 bg-background px-2 py-1 text-muted-foreground">
                                  scope:
                                  {" "}
                                  <span className="text-foreground">{issue.scope}</span>
                                </span>
                              </div>

                              {issue.meta && Object.keys(issue.meta).length > 0 && (
                                <div className="grid gap-1">
                                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Meta</div>
                                  <pre className="overflow-x-auto rounded-md border border-border/70 bg-background p-3 text-xs text-foreground">
                                    {JSON.stringify(issue.meta, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
