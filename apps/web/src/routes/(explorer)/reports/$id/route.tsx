import type { UnicodeReportRevisionMetadata } from "@ucdjs/schemas";
import { ReportNotFound } from "#components/not-found";
import { reportQueryOptions } from "#functions/reports";
import { createFileRoute, Link, Outlet, useChildMatches, useNavigate, useParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { Button } from "@ucdjs-internal/shared-ui/components";
import { AlertTriangle, ArrowLeft, ArrowRight, ExternalLink, FileText, Globe, PanelLeft, Rows3, SquareCode } from "lucide-react";
import { z } from "zod";

const reportViewSearchSchema = z.object({
  view: z.enum(["render", "code", "split"]).optional(),
});

export const Route = createFileRoute("/(explorer)/reports/$id")({
  validateSearch: zodValidator(reportViewSearchSchema),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(reportQueryOptions(params.id));
  },
  component: RouteComponent,
  errorComponent: ReportErrorComponent,
  notFoundComponent: ReportNotFoundBoundary,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/reports/$id" });
  const [activeChild] = useChildMatches();
  const { id } = Route.useParams();
  const view = Route.useSearch().view ?? "split";
  const activeData = activeChild?.loaderData as { latestRevId: string; report: UnicodeReportRevisionMetadata } | undefined;

  if (!activeData) {
    return <Outlet />;
  }

  const currentRevision = activeData.report.revision;
  const persistedSearch = view === "split" ? undefined : { view };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/20 px-3 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium" title={activeData.report.reportId}>
                {activeData.report.reportId}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {currentRevision.revision === null ? currentRevision.revId : `rev ${currentRevision.revId}`}
            </span>
            {activeData.report.title && (
              <span className="max-w-80 truncate text-xs text-muted-foreground" title={activeData.report.title}>
                {activeData.report.title}
              </span>
            )}
            {currentRevision.revId !== activeData.latestRevId && (
              <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                historical view
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-md border border-border bg-background p-0.5">
              {([
                { value: "render", label: "Render", icon: <PanelLeft className="size-4" /> },
                { value: "code", label: "Code", icon: <SquareCode className="size-4" /> },
                { value: "split", label: "Split", icon: <Rows3 className="size-4" /> },
              ] as const).map((option) => (
                <Button
                  key={option.value}
                  variant={view === option.value ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => {
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        view: option.value === "split" ? undefined : option.value,
                      }),
                    });
                  }}
                >
                  {option.icon}
                  <span className="hidden sm:inline">{option.label}</span>
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!activeData.report.previous) return;

                navigate({
                  to: "/reports/$id/rev/$rev",
                  params: { id, rev: activeData.report.previous.revId },
                  search: persistedSearch,
                });
              }}
              disabled={!activeData.report.previous}
            >
              <ArrowLeft className="size-4" />
              Older
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!activeData.report.next) return;

                if (activeData.report.next.revId === activeData.latestRevId) {
                  navigate({
                    to: "/reports/$id",
                    params: { id },
                    search: persistedSearch,
                  });
                  return;
                }

                navigate({
                  to: "/reports/$id/rev/$rev",
                  params: { id, rev: activeData.report.next.revId },
                  search: persistedSearch,
                });
              }}
              disabled={!activeData.report.next}
            >
              Newer
              <ArrowRight className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={(
                <a href={currentRevision.htmlPath} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Open HTML
                </a>
              )}
            />

            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={(
                <a href={currentRevision.upstreamUrl} target="_blank" rel="noreferrer">
                  <Globe className="size-4" />
                  Upstream
                </a>
              )}
            />
          </div>
        </div>

        <div className="bg-muted/20 p-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function ReportNotFoundBoundary() {
  const params = useParams({ strict: false });
  const reportId = typeof params.id === "string" ? params.id : undefined;
  const revId = typeof params.rev === "string" ? params.rev : undefined;

  return <ReportNotFound reportId={reportId} revId={revId} />;
}

function ReportErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-lg space-y-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-sm bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          <AlertTriangle className="size-4" />
          Report unavailable
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight">Failed to load report content</h1>
          <p className="text-sm text-muted-foreground">
            {error.message || "The requested report content could not be loaded."}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" render={<Link to="/reports">Browse reports</Link>} />
        </div>
      </div>
    </div>
  );
}
