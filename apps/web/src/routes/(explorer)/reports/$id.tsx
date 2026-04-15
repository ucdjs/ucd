import { FileViewer, FileViewerSkeleton } from "#components/file-explorer/file-viewer";
import { ReportNotFound } from "#components/not-found";
import { reportCodeQueryOptions, reportHtmlQueryOptions, reportQueryOptions, reportRevisionQueryOptions } from "#functions/reports";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { Button, Skeleton, toast } from "@ucdjs-internal/shared-ui/components";
import { ArrowLeft, ArrowRight, ExternalLink, FileText, Globe, PanelLeft, Rows3, SquareCode } from "lucide-react";
import { useCallback } from "react";
import { z } from "zod";

const reportSearchSchema = z.object({
  rev: z.string().optional(),
  view: z.enum(["render", "code", "split"]).optional(),
});

export const Route = createFileRoute("/(explorer)/reports/$id")({
  validateSearch: zodValidator(reportSearchSchema),
  loaderDeps({ search }) {
    return {
      rev: search.rev,
      view: search.view ?? "split",
    };
  },
  loader: async ({ context, params, deps }) => {
    const latest = await context.queryClient.ensureQueryData(reportQueryOptions(params.id));
    const effectiveRevId = deps.rev ?? latest.revision.revId;

    if (effectiveRevId !== latest.revision.revId) {
      await context.queryClient.ensureQueryData(reportRevisionQueryOptions(params.id, effectiveRevId));
    }

    if (deps.view !== "code") {
      await context.queryClient.prefetchQuery(reportHtmlQueryOptions(params.id, effectiveRevId));
    }

    if (deps.view !== "render") {
      await context.queryClient.prefetchQuery(reportCodeQueryOptions(params.id, effectiveRevId));
    }
  },
  component: RouteComponent,
  notFoundComponent: ReportNotFoundBoundary,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/reports/$id" });
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const view = search.view ?? "split";
  const { data: latest } = useSuspenseQuery(reportQueryOptions(id));
  const effectiveRevId = search.rev ?? latest.revision.revId;

  const selectedRevisionQuery = useQuery({
    ...reportRevisionQueryOptions(id, effectiveRevId),
    enabled: effectiveRevId !== latest.revision.revId,
  });

  const htmlQuery = useQuery({
    ...reportHtmlQueryOptions(id, effectiveRevId),
    enabled: view !== "code",
  });

  const codeQuery = useQuery({
    ...reportCodeQueryOptions(id, effectiveRevId),
    enabled: view !== "render",
  });

  if (selectedRevisionQuery.error) {
    throw selectedRevisionQuery.error;
  }

  if (htmlQuery.error) {
    throw htmlQuery.error;
  }

  if (codeQuery.error) {
    throw codeQuery.error;
  }

  const report = selectedRevisionQuery.data ?? latest;
  const currentRevision = report.revision;
  const openHtmlUrl = currentRevision.htmlPath;
  const isLatestRevision = effectiveRevId === latest.revision.revId;
  const fileName = `${report.reportId}-${currentRevision.revId}.html`;

  const handleDownload = useCallback(async () => {
    try {
      if (typeof document === "undefined" || typeof window === "undefined") return;

      const response = await fetch(openHtmlUrl);

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }

      const blobUrl = window.URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = fileName;
      anchor.rel = "noopener noreferrer";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download file.";
      toast.error(message);
    }
  }, [fileName, openHtmlUrl]);

  useHotkey("Mod+Shift+B", () => {
    void handleDownload();
  }, { preventDefault: true });

  function updateSearch(next: Partial<z.output<typeof reportSearchSchema>>) {
    navigate({
      search: (prev) => {
        const nextRev = next.rev === latest.revision.revId ? undefined : next.rev ?? prev.rev;
        const nextView = next.view ?? prev.view;

        return {
          ...prev,
          ...next,
          rev: nextRev,
          view: nextView === "split" ? undefined : nextView,
        };
      },
    });
  }

  const previousRevision = report.previous;
  const nextRevision = report.next;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/20 px-3 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium" title={report.reportId}>
                {report.reportId}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {currentRevision.revision === null ? currentRevision.revId : `rev ${currentRevision.revId}`}
            </span>
            {report.title && (
              <span className="truncate text-xs text-muted-foreground max-w-80" title={report.title}>
                {report.title}
              </span>
            )}
            {!isLatestRevision && (
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
                  onClick={() => updateSearch({ view: option.value })}
                >
                  {option.icon}
                  <span className="hidden sm:inline">{option.label}</span>
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => previousRevision && updateSearch({ rev: previousRevision.revId })}
              disabled={!previousRevision}
            >
              <ArrowLeft className="size-4" />
              Older
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => nextRevision && updateSearch({ rev: nextRevision.revId })}
              disabled={!nextRevision}
            >
              Newer
              <ArrowRight className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={(
                <a href={openHtmlUrl} target="_blank" rel="noreferrer">
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
          {view === "render" && (
            <RenderPanel
              html={htmlQuery.data}
              isLoading={htmlQuery.isPending}
              upstreamUrl={currentRevision.upstreamUrl}
            />
          )}

          {view === "code" && (
            <CodePanel
              codeHtml={codeQuery.data}
              isLoading={codeQuery.isPending}
              fileName={fileName}
              fileUrl={openHtmlUrl}
              onDownload={handleDownload}
              viewportClassName="h-[70vh]"
            />
          )}

          {view === "split" && (
            <div className="grid gap-3 xl:grid-cols-2">
              <CodePanel
                codeHtml={codeQuery.data}
                isLoading={codeQuery.isPending}
                fileName={fileName}
                fileUrl={openHtmlUrl}
                onDownload={handleDownload}
                viewportClassName="h-[70vh]"
              />
              <RenderPanel
                html={htmlQuery.data}
                isLoading={htmlQuery.isPending}
                upstreamUrl={currentRevision.upstreamUrl}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RenderPanel({
  html,
  isLoading,
  upstreamUrl,
}: {
  html?: string;
  isLoading: boolean;
  upstreamUrl: string;
}) {
  if (isLoading || !html) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className="space-y-3 p-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-[70vh] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-3 py-2">
        <span className="text-sm font-medium">Rendered document</span>
        <span className="text-xs text-muted-foreground">Live HTML preview</span>
      </div>
      <iframe
        title="Unicode report preview"
        // eslint-disable-next-line e18e/prefer-static-regex
        srcDoc={/<head[^>]*>/i.test(html)
          // eslint-disable-next-line e18e/prefer-static-regex
          ? html.replace(/<head([^>]*)>/i, `<head$1><base href="${upstreamUrl}">`)
          : `<base href="${upstreamUrl}">${html}`}
        className="h-[70vh] w-full bg-white"
        // Keep upstream report HTML isolated from the parent application.
        sandbox="allow-popups"
      />
    </div>
  );
}

function CodePanel({
  codeHtml,
  isLoading,
  fileName,
  fileUrl,
  onDownload,
  viewportClassName,
}: {
  codeHtml?: string;
  isLoading: boolean;
  fileName: string;
  fileUrl: string;
  onDownload: () => void;
  viewportClassName?: string;
}) {
  if (isLoading || !codeHtml) {
    return <FileViewerSkeleton fileName={fileName} viewportClassName={viewportClassName} />;
  }

  return (
    <FileViewer
      html={codeHtml}
      fileName={fileName}
      fileUrl={fileUrl}
      onDownload={onDownload}
      viewportClassName={viewportClassName}
    />
  );
}

function ReportNotFoundBoundary() {
  const { id } = Route.useParams();
  const search = Route.useSearch();

  return <ReportNotFound reportId={id} revId={search.rev} />;
}
