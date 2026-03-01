import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";
import { TrendingUp } from "lucide-react";

interface DailyExecution {
  date: string;
  total: number;
  success: number;
  failed: number;
}

export interface ActivitySparklineProps {
  data: DailyExecution[];
}

export function ActivitySparkline({ data }: ActivitySparklineProps) {
  // Calculate totals and success rate
  const totalExecutions = data.reduce((sum, day) => sum + day.total, 0);
  const successfulExecutions = data.reduce((sum, day) => sum + day.success, 0);
  const successRate = totalExecutions > 0
    ? Math.round((successfulExecutions / totalExecutions) * 100)
    : 0;

  // SVG dimensions
  const width = 300;
  const height = 100;
  const padding = { top: 10, right: 10, bottom: 10, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const maxValue = Math.max(...data.map((d: DailyExecution) => d.total), 1);
  const xScale = chartWidth / Math.max(data.length - 1, 1);
  const yScale = chartHeight / maxValue;

  // Generate path points
  const points = data.map((day, index) => ({
    x: padding.left + index * xScale,
    y: padding.top + chartHeight - day.total * yScale,
  }));

  // Create path string
  const linePath = points.length > 1
    ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    : "";

  // Create area path (for gradient fill)
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaPath = points.length > 1 && firstPoint && lastPoint
    ? `${linePath} L ${lastPoint.x} ${padding.top + chartHeight} L ${firstPoint.x} ${padding.top + chartHeight} Z`
    : "";

  // Format dates for labels
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "narrow" });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Activity (7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Sparkline Chart */}
          <div className="relative h-[100px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              {areaPath && (
                <path d={areaPath} fill="url(#sparklineGradient)" />
              )}

              {/* Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="hsl(var(--primary))"
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>

          {/* Day labels */}
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            {data.map((day, i) => (
              <span key={i}>{formatDate(day.date)}</span>
            ))}
          </div>

          {/* Stats footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-sm">
              <span className="text-muted-foreground">Total:</span>
              {" "}
              <span className="font-semibold">{totalExecutions}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Success Rate:</span>
              {" "}
              <span className={`font-semibold ${successRate >= 90 ? "text-green-600" : successRate >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                {successRate}
                %
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
