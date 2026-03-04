import { cn } from "@ucdjs-internal/shared-ui/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { TrendingUp } from "lucide-react";
import { useId } from "react";

interface DailyExecution {
  date: string;
  total: number;
  success: number;
  failed: number;
}

export interface ActivitySparklineProps {
  data: DailyExecution[];
  compact?: boolean;
  variant?: "default" | "compact" | "epic";
}

export function ActivitySparkline({ data, compact = false, variant }: ActivitySparklineProps) {
  const resolvedVariant = variant ?? (compact ? "compact" : "default");
  const isCompact = resolvedVariant === "compact";
  const isEpic = resolvedVariant === "epic";
  const id = useId();

  const totalExecutions = data.reduce((sum, day) => sum + day.total, 0);
  const successfulExecutions = data.reduce((sum, day) => sum + day.success, 0);
  const successRate = totalExecutions > 0
    ? Math.round((successfulExecutions / totalExecutions) * 100)
    : 0;

  const width = 300;
  const height = isEpic ? 200 : isCompact ? 72 : 100;
  const labelHeight = isCompact ? 0 : 18;
  const padding = { top: 12, right: 12, bottom: isCompact ? 6 : 10, left: 12 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom - labelHeight;

  const totals = data.map((day) => Math.max(day.total, day.success + day.failed));
  const maxValue = Math.max(...totals, 1);
  const bandWidth = chartWidth / Math.max(data.length, 1);
  const barWidth = Math.min(bandWidth * 0.7, isEpic ? 28 : 22);
  const barRadius = isEpic ? 7 : 5;

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00Z`);
    return date.toLocaleDateString("en-US", { weekday: "narrow", timeZone: "UTC" });
  };

  return (
    <Card
      className={cn(
        "h-full",
        isEpic && "relative overflow-hidden border-border/60 shadow-[0_20px_60px_-50px_hsl(var(--primary)/0.5)]",
      )}
    >
      <CardHeader className={cn(isCompact ? "pb-1" : "pb-2", isEpic && "relative")}>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Activity (7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(isEpic && "relative")}>
        <div className={isCompact ? "space-y-2" : isEpic ? "space-y-3" : "space-y-4"}>
          <div className="relative" style={{ height: `${height}px` }}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">

              {data.map((day, index) => {
                const total = totals[index] ?? 0;
                const totalHeight = total === 0 ? 0 : (total / maxValue) * chartHeight;
                const failedHeight = total === 0 ? 0 : (day.failed / maxValue) * chartHeight;
                const successHeight = total === 0 ? 0 : (day.success / maxValue) * chartHeight;
                const bottom = padding.top + chartHeight;
                const x = padding.left + index * bandWidth + (bandWidth - barWidth) / 2;
                const hasRemainder = total > day.success + day.failed;

                let currentY = bottom;

                const failedRect = failedHeight > 0
                  ? {
                      y: bottom - failedHeight,
                      height: failedHeight,
                      radius: (!hasRemainder && successHeight === 0) ? barRadius : 0,
                    }
                  : null;

                if (failedRect) {
                  currentY = failedRect.y;
                }

                const successRect = successHeight > 0
                  ? {
                      y: currentY - successHeight,
                      height: successHeight,
                      radius: !hasRemainder ? barRadius : 0,
                    }
                  : null;

                return (
                  <g key={day.date}>
                    {totalHeight > 0 && (
                      <rect
                        x={x}
                        y={bottom - totalHeight}
                        width={barWidth}
                        height={totalHeight}
                        rx={barRadius}
                        ry={barRadius}
                        fill="var(--border)"
                        opacity={isEpic ? 0.35 : 0.25}
                      />
                    )}
                    {failedRect && (
                      <rect
                        x={x}
                        y={failedRect.y}
                        width={barWidth}
                        height={failedRect.height}
                        rx={failedRect.radius}
                        ry={failedRect.radius}
                        fill="var(--destructive)"
                        opacity={isEpic ? 1 : 0.95}
                      />
                    )}
                    {successRect && (
                      <rect
                        x={x}
                        y={successRect.y}
                        width={barWidth}
                        height={successRect.height}
                        rx={successRect.radius}
                        ry={successRect.radius}
                        fill="var(--chart-4)"
                        opacity={isEpic ? 1 : 0.95}
                      />
                    )}
                  </g>
                );
              })}

              {!isCompact && (
                <g>
                  {data.map((day, index) => {
                    const labelX = padding.left + index * bandWidth + bandWidth / 2;
                    const labelY = padding.top + chartHeight + labelHeight - 4;
                    return (
                      <text
                        key={`${day.date}-label`}
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--muted-foreground)"
                      >
                        {formatDate(day.date)}
                      </text>
                    );
                  })}
                </g>
              )}
            </svg>
          </div>

          <div
            className={cn(
              isCompact
                ? "flex items-center justify-between pt-2"
                : "flex items-center justify-between pt-3 border-t border-border/60",
            )}
          >
            {!isCompact && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--chart-4)" }} />
                  Success
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--destructive)" }} />
                  Failed
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>
                {" "}
                <span className="font-semibold">{totalExecutions}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Success Rate:</span>
                {" "}
                <span className={`font-semibold ${successRate >= 90 ? "text-green-600" : successRate >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                  {successRate}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
