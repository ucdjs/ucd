import type { SourceResponse, SourceSummary } from "#shared/schemas/source";
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
import { AlertTriangle } from "lucide-react";

type SourceIssue = SourceResponse["errors"][number] | SourceSummary["errors"][number];

interface SourceIssuesDialogProps {
  issues: SourceIssue[];
  title: string;
  description?: string;
  triggerLabel: string;
  triggerClassName?: string;
  triggerVariant?: "outline" | "secondary" | "ghost" | "destructive" | "link";
  triggerSize?: "default" | "xs" | "sm";
}

export function SourceIssuesDialog({
  issues,
  title,
  description,
  triggerLabel,
  triggerClassName,
  triggerVariant = "outline",
  triggerSize = "sm",
}: SourceIssuesDialogProps) {
  const groups = new Map<string, SourceIssue[]>();

  for (const issue of issues) {
    const key = issue.relativePath ?? issue.filePath ?? "Unknown file";
    const group = groups.get(key);
    if (group) {
      group.push(issue);
    } else {
      groups.set(key, [issue]);
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={(
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className={triggerClassName}
          />
        )}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent
        className="grid-rows-[auto_minmax(0,1fr)_auto] h-[90vh] !w-[72rem] !max-w-[calc(100vw-2rem)] overflow-hidden p-0"
        data-testid="source-issues-dialog"
        showCloseButton
      >
        <DialogHeader className="border-b border-border/60 px-5 pt-5 pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? `Inspect ${issues.length} recorded source issue${issues.length === 1 ? "" : "s"}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-5 py-4">
          <div className="grid gap-4">
          {Array.from(groups.entries()).map(([path, groupedIssues]) => (
            <section key={path} className="grid gap-3">
              <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">File</div>
                <code className="mt-1 block break-all text-xs text-foreground">{path}</code>
              </div>

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
            </section>
          ))}
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
