import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

interface DailyExecution {
  date: string;
  total: number;
  success: number;
  failed: number;
}

type FilterMode = "all" | "success" | "failed";

export interface ActivityBarChartProps {
  data: DailyExecution[];
  variant?: "default" | "epic";
}

const AXIS_TICKS = 4;

function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { weekday: "narrow", timeZone: "UTC" });
}

export function ActivityBarChart({ data, variant = "default" }: ActivityBarChartProps) {
  const [mode, setMode] = useState<FilterMode>("all");
  const isEpic = variant === "epic";

  const showSuccess = mode !== "failed";
  const showFailed = mode !== "success";

  const totals = useMemo(
    () => data.map((day) => day.success + day.failed),
    [data],
  );

  const visibleTotals = useMemo(
    () => data.map((day) => (showSuccess ? day.success : 0) + (showFailed ? day.failed : 0)),
    [data, showSuccess, showFailed],
  );

  const scaleMax = useMemo(() => Math.max(...visibleTotals, 1), [visibleTotals]);

  const axisTicks = useMemo(() => {
    return Array.from({ length: AXIS_TICKS }, (_, index) => {
      const value = scaleMax - (scaleMax / (AXIS_TICKS - 1)) * index;
      return Math.max(0, Math.round(value));
    });
  }, [scaleMax]);

  const summary = useMemo(() => {
    const totalExecutions = data.reduce((sum, day) => sum + day.success + day.failed, 0);
    const successfulExecutions = data.reduce((sum, day) => sum + day.success, 0);
    const failedExecutions = data.reduce((sum, day) => sum + day.failed, 0);

    if (mode === "success") {
      return {
        total: successfulExecutions,
        successRate: totalExecutions > 0
          ? Math.round((successfulExecutions / totalExecutions) * 100)
          : 0,
      };
    }

    if (mode === "failed") {
      return {
        total: failedExecutions,
        successRate: totalExecutions > 0
          ? Math.round((successfulExecutions / totalExecutions) * 100)
          : 0,
      };
    }

    return {
      total: totalExecutions,
      successRate: totalExecutions > 0
        ? Math.round((successfulExecutions / totalExecutions) * 100)
        : 0,
    };
  }, [data, mode]);

  const chartHeight = isEpic ? 220 : 180;
  const axisWidth = 36;
  const labelRowHeight = 22;
  const radius = 10;

  return (
    <Card className={cn("h-full", isEpic && "border-border/60 shadow-[0_20px_60px_-50px_hsl(var(--primary)/0.5)]")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Activity (7 Days)
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode(mode === "success" ? "all" : "success")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-2.5 py-1",
                mode === "success"
                  ? "text-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
              style={mode === "success"
                ? {
                    borderColor: "var(--chart-4)",
                    backgroundColor: "color-mix(in srgb, var(--chart-4) 18%, transparent)",
                  }
                : undefined}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--chart-4)" }} />
              Success
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "failed" ? "all" : "failed")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-2.5 py-1",
                mode === "failed"
                  ? "text-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
              style={mode === "failed"
                ? {
                    borderColor: "var(--destructive)",
                    backgroundColor: "color-mix(in srgb, var(--destructive) 14%, transparent)",
                  }
                : undefined}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--destructive)" }} />
              Failed
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className="grid gap-3"
            style={{ gridTemplateRows: `${chartHeight}px ${labelRowHeight}px` }}
          >
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `${axisWidth}px 1fr`, height: chartHeight }}
            >
              <div className="relative h-full">
                {axisTicks.map((tick, index) => {
                  const top = (index / (AXIS_TICKS - 1)) * 100;
                  const translate = index === 0 ? "-20%" : index === AXIS_TICKS - 1 ? "-80%" : "-50%";
                  return (
                    <div
                      key={tick}
                      className="absolute left-0 text-[11px] text-muted-foreground"
                      style={{ top: `${top}%`, transform: `translateY(${translate})` }}
                    >
                      {tick}
                    </div>
                  );
                })}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-border/60" />
              </div>

              <div className="grid grid-cols-7 gap-3 items-end h-full">
                {data.map((day, index) => {
                  const total = totals[index] ?? 0;
                  const failedHeight = total === 0 || !showFailed ? 0 : (day.failed / scaleMax) * 100;
                  const successHeight = total === 0 || !showSuccess ? 0 : (day.success / scaleMax) * 100;
                  const displayTotal = (showSuccess ? day.success : 0) + (showFailed ? day.failed : 0);
                  const displayHeight = displayTotal === 0 ? 0 : (displayTotal / scaleMax) * 100;
                  const labelTop = Math.max(0, Math.min(100, 100 - displayHeight));
                  const labelClamp = 8;
                  const labelInside = labelTop < labelClamp;
                  const hasBoth = showSuccess && showFailed && successHeight > 0 && failedHeight > 0;

                  const successRadius = hasBoth
                    ? {
                        borderTopLeftRadius: `${radius}px`,
                        borderTopRightRadius: `${radius}px`,
                        borderBottomLeftRadius: "2px",
                        borderBottomRightRadius: "2px",
                      }
                    : { borderRadius: `${radius}px` };

                  const failedRadius = hasBoth
                    ? {
                        borderBottomLeftRadius: `${radius}px`,
                        borderBottomRightRadius: `${radius}px`,
                        borderTopLeftRadius: "0px",
                        borderTopRightRadius: "0px",
                      }
                    : { borderRadius: `${radius}px` };

                  return (
                    <div key={day.date} className="relative h-full">
                      <div className="absolute inset-0 rounded-[14px] bg-muted/40 border border-border/60 overflow-hidden">
                        <div className="absolute inset-0 flex flex-col justify-end">
                          {displayTotal > 0 && (
                            <span
                              className={cn(
                                "absolute left-1/2 -translate-x-1/2 text-[11px] font-medium",
                                labelInside ? "text-white/90" : "text-muted-foreground",
                              )}
                              style={{
                                top: `${labelInside ? labelClamp : labelTop}%`,
                                transform: labelInside
                                  ? "translate(-50%, 0)"
                                  : "translate(-50%, -100%)",
                              }}
                            >
                              {displayTotal}
                            </span>
                          )}
                          {showSuccess && successHeight > 0 && (
                            <div
                              className="w-full bg-chart-4 transition-[height] duration-300 ease-out"
                              style={{ height: `${successHeight}%`, ...successRadius }}
                            />
                          )}
                          {showFailed && failedHeight > 0 && (
                            <div
                              className="w-full bg-destructive transition-[height] duration-300 ease-out"
                              style={{ height: `${failedHeight}%`, ...failedRadius }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `${axisWidth}px 1fr`, height: labelRowHeight }}
            >
              <div />
              <div className="grid grid-cols-7 gap-3">
                {data.map((day) => (
                  <span key={`${day.date}-label`} className="text-xs text-muted-foreground text-center">
                    {formatDate(day.date)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div className="text-sm text-muted-foreground">
              Total:
              {" "}
              <span className="font-semibold text-foreground">{summary.total}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Success Rate:</span>
              {" "}
              <span className={`font-semibold ${summary.successRate >= 90 ? "text-green-600" : summary.successRate >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                {summary.successRate}
                %
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
