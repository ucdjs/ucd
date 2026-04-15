import { reportsQueryOptions } from "#functions/reports";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/components";
import { ArrowRight, FileText } from "lucide-react";

export const Route = createFileRoute("/(explorer)/reports/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: reports } = useSuspenseQuery(reportsQueryOptions());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Unicode Reports</h1>
          <p className="text-sm text-muted-foreground">
            Browse report metadata and jump directly into the latest published revisions.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {reports.length}
          {" "}
          reports
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="overflow-hidden">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="size-4 shrink-0 text-amber-500" />
                    <span className="truncate">{report.id}</span>
                  </CardTitle>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {report.title ?? "Untitled report"}
                  </p>
                </div>
                {report.latest && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                    rev
                    {" "}
                    {report.latest.revId}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 border-t pt-4">
              <div className="text-xs text-muted-foreground">
                {report.previous
                  ? (
                      <>
                        Previous:
                        {" "}
                        {report.previous.revId}
                      </>
                    )
                  : "No previous revision"}
              </div>
              <Button
                size="sm"
                nativeButton={false}
                render={(
                  <Link to="/reports/$id" params={{ id: report.id }}>
                    Open
                    <ArrowRight className="size-4" />
                  </Link>
                )}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
