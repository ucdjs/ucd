import type { ExecuteResult } from "../../types";
import { cn } from "#lib/utils";
import { memo } from "react";

export interface ExecutionResultProps {
  result: ExecuteResult;
  className?: string;
}

/**
 * Displays the result of a pipeline execution
 */
export const ExecutionResult = memo(({
  result,
  className,
}: ExecutionResultProps) => {
  const isSuccess = result.success;

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        isSuccess
          ? "bg-primary/10 border-primary/30"
          : "bg-destructive/10 border-destructive/40",
        className,
      )}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isSuccess ? "bg-primary" : "bg-destructive",
          )}
        />
        <span
          className={cn(
            "text-sm font-medium",
            isSuccess ? "text-primary" : "text-destructive",
          )}
        >
          {isSuccess ? "Completed" : "Failed"}
        </span>
      </div>

      {/* Summary stats */}
      {result.summary && (
        <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <span className="text-muted-foreground block">Files</span>
            <span className="text-foreground">{result.summary.totalFiles}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Matched</span>
            <span className="text-primary">
              {result.summary.matchedFiles}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Skipped</span>
            <span className="text-foreground/80">{result.summary.skippedFiles}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Fallback</span>
            <span className="text-amber-400">{result.summary.fallbackFiles}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Outputs</span>
            <span className="text-foreground">{result.summary.totalOutputs}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Time</span>
            <span className="text-foreground">
              {Math.round(result.summary.durationMs)}
              ms
            </span>
          </div>
        </div>
      )}

      {/* Top-level error */}
      {result.error && (
        <p className="text-sm text-destructive mt-2">{result.error}</p>
      )}

      {/* Detailed errors list */}
      {result.errors && result.errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {result.errors.map((err, i) => (
            <div key={i} className="text-xs">
              <span className="text-destructive">
                [
                {err.scope}
                ]
              </span>
              {" "}
              <span className="text-destructive/90">{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export interface ExecutionSummaryProps {
  totalFiles: number;
  matchedFiles: number;
  skippedFiles: number;
  fallbackFiles: number;
  totalOutputs: number;
  durationMs: number;
  className?: string;
}

/**
 * Compact execution summary (without result wrapper)
 */
export const ExecutionSummary = memo(({
  totalFiles,
  matchedFiles,
  skippedFiles,
  fallbackFiles,
  totalOutputs,
  durationMs,
  className,
}: ExecutionSummaryProps) => {
  return (
    <div className={cn("grid grid-cols-2 gap-4 text-xs sm:grid-cols-3 lg:grid-cols-6", className)}>
      <div>
        <span className="text-muted-foreground block">Files</span>
        <span className="text-foreground">{totalFiles}</span>
      </div>
      <div>
        <span className="text-muted-foreground block">Matched</span>
        <span className="text-primary">{matchedFiles}</span>
      </div>
      <div>
        <span className="text-muted-foreground block">Skipped</span>
        <span className="text-foreground/80">{skippedFiles}</span>
      </div>
      <div>
        <span className="text-muted-foreground block">Fallback</span>
        <span className="text-amber-400">{fallbackFiles}</span>
      </div>
      <div>
        <span className="text-muted-foreground block">Outputs</span>
        <span className="text-foreground">{totalOutputs}</span>
      </div>
      <div>
        <span className="text-muted-foreground block">Time</span>
        <span className="text-foreground">
          {Math.round(durationMs)}
          ms
        </span>
      </div>
    </div>
  );
});

export interface ExecutionErrorsProps {
  errors: Array<{ scope: string; message: string }>;
  className?: string;
}

/**
 * List of execution errors
 */
export const ExecutionErrors = memo(({
  errors,
  className,
}: ExecutionErrorsProps) => {
  if (errors.length === 0) return null;

  return (
    <div className={cn("space-y-1", className)}>
      {errors.map((err, i) => (
        <div key={i} className="text-xs">
          <span className="text-destructive">
            [
            {err.scope}
            ]
          </span>
          {" "}
          <span className="text-destructive/90">{err.message}</span>
        </div>
      ))}
    </div>
  );
});
