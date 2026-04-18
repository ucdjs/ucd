import { FileViewer, FileViewerSkeleton } from "#components/file-explorer/file-viewer";
import { reportCodeQueryOptions, reportQueryOptions } from "#functions/reports";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Skeleton, toast } from "@ucdjs-internal/shared-ui/components";
import { Suspense } from "react";

const reportRouteApi = getRouteApi("/(explorer)/reports/$id");

export const Route = createFileRoute("/(explorer)/reports/$id/")({
  loaderDeps({ search }) {
    return {
      view: search.view ?? "split",
    };
  },
  loader: async ({ context, params, deps }) => {
    const report = await context.queryClient.ensureQueryData(reportQueryOptions(params.id));

    if (deps.view !== "render") {
      await context.queryClient.prefetchQuery(reportCodeQueryOptions(params.id, report.revision.revId));
    }

    return {
      latestRevId: report.revision.revId,
      report,
      previewUrl: new URL(report.revision.htmlPath, context.apiBaseUrl).toString(),
      rawFileUrl: new URL(`/api/v1/reports/${report.reportId}/rev/${report.revision.revId}/raw`, context.apiBaseUrl).toString(),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { previewUrl, rawFileUrl, report } = Route.useLoaderData();
  const view = reportRouteApi.useSearch().view ?? "split";

  const fileName = `${report.reportId}-${report.revision.revId}.html`;

  async function handleDownload() {
    try {
      if (typeof document === "undefined" || typeof window === "undefined") return;

      const response = await fetch(rawFileUrl);

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
      toast.error(error instanceof Error ? error.message : "Failed to download file.");
    }
  }

  useHotkey("Mod+Shift+B", () => {
    void handleDownload();
  }, { preventDefault: true });

  if (view === "render") {
    return (
      <Suspense fallback={<RenderPaneFallback />}>
        <RenderPane
          previewUrl={previewUrl}
        />
      </Suspense>
    );
  }

  if (view === "code") {
    return (
      <Suspense fallback={<FileViewerSkeleton fileName={fileName} viewportClassName="h-[70vh]" />}>
        <CodePane
          reportId={report.reportId}
          revId={report.revision.revId}
          fileName={fileName}
          fileUrl={rawFileUrl}
          onDownload={handleDownload}
        />
      </Suspense>
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Suspense fallback={<FileViewerSkeleton fileName={fileName} viewportClassName="h-[70vh]" />}>
        <CodePane
          reportId={report.reportId}
          revId={report.revision.revId}
          fileName={fileName}
          fileUrl={rawFileUrl}
          onDownload={handleDownload}
        />
      </Suspense>
      <Suspense fallback={<RenderPaneFallback />}>
        <RenderPane
          previewUrl={previewUrl}
        />
      </Suspense>
    </div>
  );
}

function RenderPane({
  previewUrl,
}: {
  previewUrl: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-3 py-2">
        <span className="text-sm font-medium">Rendered document</span>
        <span className="text-xs text-muted-foreground">Live HTML preview</span>
      </div>
      <iframe
        title="Unicode report preview"
        src={previewUrl}
        className="h-[70vh] w-full bg-white"
        sandbox="allow-popups"
      />
    </div>
  );
}

function RenderPaneFallback() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    </div>
  );
}

function CodePane({
  reportId,
  revId,
  fileName,
  fileUrl,
  onDownload,
}: {
  reportId: string;
  revId: string;
  fileName: string;
  fileUrl: string;
  onDownload: () => void;
}) {
  const { data: codeHtml } = useSuspenseQuery(reportCodeQueryOptions(reportId, revId));

  return (
    <FileViewer
      html={codeHtml}
      fileName={fileName}
      fileUrl={fileUrl}
      onDownload={onDownload}
      viewportClassName="h-[70vh]"
    />
  );
}
