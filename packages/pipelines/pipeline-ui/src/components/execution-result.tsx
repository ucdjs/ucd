import type { ExecuteResult } from "../types";
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
          ? "bg-emerald-950/30 border-emerald-900"
          : "bg-red-950/30 border-red-900",
        className,
      )}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isSuccess ? "bg-emerald-400" : "bg-red-400",
          )}
        />
        <span
          className={cn(
            "text-sm font-medium",
            isSuccess ? "text-emerald-400" : "text-red-400",
          )}
        >
          {isSuccess ? "Completed" : "Failed"}
        </span>
      </div>

      {/* Summary stats */}
      {result.summary && (
        <div className="grid grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-zinc-500 block">Routes</span>
            <span className="text-zinc-200">{result.summary.totalRoutes}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Success</span>
            <span className="text-emerald-400">
              {result.summary.successfulRoutes}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block">Failed</span>
            <span className="text-red-400">{result.summary.failedRoutes}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Time</span>
            <span className="text-zinc-200">
              {result.summary.totalTime}
              ms
            </span>
          </div>
        </div>
      )}

      {/* Top-level error */}
      {result.error && (
        <p className="text-sm text-red-300 mt-2">{result.error}</p>
      )}

      {/* Detailed errors list */}
      {result.errors && result.errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {result.errors.map((err, i) => (
            <div key={i} className="text-xs">
              <span className="text-red-400">
                [
                {err.scope}
                ]
              </span>
              {" "}
              <span className="text-red-300">{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export interface ExecutionSummaryProps {
  totalRoutes: number;
  successfulRoutes: number;
  failedRoutes: number;
  totalTime: number;
  className?: string;
}

/**
 * Compact execution summary (without result wrapper)
 */
export const ExecutionSummary = memo(({
  totalRoutes,
  successfulRoutes,
  failedRoutes,
  totalTime,
  className,
}: ExecutionSummaryProps) => {
  return (
    <div className={cn("grid grid-cols-4 gap-4 text-xs", className)}>
      <div>
        <span className="text-zinc-500 block">Routes</span>
        <span className="text-zinc-200">{totalRoutes}</span>
      </div>
      <div>
        <span className="text-zinc-500 block">Success</span>
        <span className="text-emerald-400">{successfulRoutes}</span>
      </div>
      <div>
        <span className="text-zinc-500 block">Failed</span>
        <span className="text-red-400">{failedRoutes}</span>
      </div>
      <div>
        <span className="text-zinc-500 block">Time</span>
        <span className="text-zinc-200">
          {totalTime}
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
          <span className="text-red-400">
            [
            {err.scope}
            ]
          </span>
          {" "}
          <span className="text-red-300">{err.message}</span>
        </div>
      ))}
    </div>
  );
});
