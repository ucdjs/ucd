import type { PipelineLoadError } from "../schemas/source";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ucdjs-internal/shared-ui/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";

export interface PipelineErrorsBannerProps {
  errors: PipelineLoadError[];
  scope: "source" | "file" | "pipeline";
  targetLabel: string;
  allFailed?: boolean;
}

export function PipelineErrorsBanner({
  errors,
  scope,
  targetLabel,
  allFailed = false,
}: PipelineErrorsBannerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const groupedErrors = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const error of errors) {
      const key = error.filePath || "Source";
      const existing = groups.get(key) ?? [];
      existing.push(error.message);
      groups.set(key, existing);
    }
    return [...groups.entries()];
  }, [errors]);

  if (errors.length === 0) {
    return null;
  }

  const heading = allFailed
    ? `Failed to load this ${scope}`
    : `Some ${scope} files failed to load`;

  const summary = allFailed
    ? `No ${scope} files could be rendered.`
    : "Loaded files are shown below.";

  return (
    <>
      <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">{heading}</p>
              <p className="text-xs text-destructive/80">
                {summary}
                {" "}
                {errors.length}
                {" "}
                error
                {errors.length !== 1 ? "s" : ""}
                {" "}
                detected.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setIsOpen(true)}
          >
            View errors
          </Button>
        </div>
      </section>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {errors.length}
              {" "}
              {scope}
              {" "}
              error
              {errors.length !== 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              Review all loading errors for
              {" "}
              <code className="rounded bg-muted px-1 py-0.5">{targetLabel}</code>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
            {groupedErrors.map(([filePath, messages]) => (
              <div key={filePath} className="rounded-md border border-border bg-muted/20 p-3">
                <p className="text-xs font-mono text-foreground break-all">{filePath}</p>
                <ul className="mt-2 space-y-1">
                  {messages.map((message) => (
                    <li
                      key={`${filePath}-${message}`}
                      className="text-xs text-destructive/90 break-all"
                    >
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
