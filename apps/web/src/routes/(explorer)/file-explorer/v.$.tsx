import { FileViewer, FileViewerSkeleton } from "#components/file-explorer/file-viewer";
import { LargeFileWarning } from "#components/file-explorer/large-file-warning";
import { NonRenderableFile } from "#components/file-explorer/non-renderable-file";
import { ExplorerNotFound } from "#components/not-found";
import { filesQueryOptions, getFileHeadInfo } from "#functions/files";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "@ucdjs-internal/shared-ui/components";
import { resolveUCDVersion } from "@unicode-utils/core";
import { Suspense, useCallback } from "react";
import { MAX_INLINE_FILE_SIZE, NON_RENDERABLE_EXTENSIONS, parseExplorerRoutePath } from "../../../lib/file-explorer";

export const Route = createFileRoute("/(explorer)/file-explorer/v/$")({
  component: FileViewerPage,
  async beforeLoad({ params, search }) {
    const rawPath = params._splat || "";
    const { pathSegments, path: normalizedPath } = parseExplorerRoutePath(rawPath);
    const version = pathSegments[0] ?? "";
    const rest = pathSegments.slice(1);
    const path = version ? [resolveUCDVersion(version), ...rest].join("/") : normalizedPath;

    if (path !== rawPath) {
      throw redirect({
        to: "/file-explorer/v/$",
        params: { _splat: path },
        search,
      });
    }

    const { statType, size, contentType } = await getFileHeadInfo({ data: { path } });

    if (statType !== "file") {
      throw redirect({
        to: "/file-explorer/$",
        params: { _splat: path },
      });
    }

    // Extract file info for early checks
    const fileName = (version ? rest : pathSegments).at(-1) || "file";
    const fileExt = fileName.split(".").pop()?.toLowerCase() || "";

    return {
      path,
      statType,
      size,
      contentType,
      fileName,
      fileExt,
    };
  },
  loader: async ({ context }) => {
    const isTooLarge = context.size !== null && context.size > MAX_INLINE_FILE_SIZE;
    const canRender = !NON_RENDERABLE_EXTENSIONS.has(context.fileExt);

    // Only prefetch if we'll actually render the file content
    if (!isTooLarge && canRender) {
      context.queryClient.prefetchQuery(filesQueryOptions({
        path: context.path,
        statType: context.statType,
        size: context.size,
      }));
    }

    return {
      statType: context.statType,
      size: context.size,
      fileName: context.fileName,
      fileExt: context.fileExt,
      path: context.path,
      contentType: context.contentType,
      isTooLarge,
      canRender,
      fileUrl: new URL(context.path, `${context.apiBaseUrl}/api/v1/files/`).toString(),
    };
  },
  notFoundComponent: FileNotFoundBoundary,
});

function FileViewerPage() {
  const {
    size,
    fileName,
    path,
    isTooLarge,
    canRender,
    fileUrl,
    statType,
    contentType,
  } = Route.useLoaderData();

  const handleOpenRawFile = useCallback(() => {
    if (typeof window === "undefined") return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }, [fileUrl]);

  const handleDownloadFile = useCallback(async () => {
    try {
      if (typeof document === "undefined" || typeof window === "undefined") return;

      const response = await fetch(fileUrl);

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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download file.";
      toast.error(message);
    }
  }, [fileName, fileUrl]);

  useHotkey("Mod+Shift+O", () => {
    handleOpenRawFile();
  }, { preventDefault: true });

  useHotkey("Mod+Shift+B", () => {
    void handleDownloadFile();
  }, { preventDefault: true });

  // Check for non-renderable files - no data fetching needed
  if (!canRender) {
    return (
      <NonRenderableFile
        fileName={fileName}
        contentType={contentType}
        onDownload={handleDownloadFile}
      />
    );
  }

  // Check for large files first - no data fetching needed
  if (size !== null && isTooLarge) {
    return (
      <LargeFileWarning
        fileName={fileName}
        size={size}
        contentType={contentType}
        onDownload={handleDownloadFile}
      />
    );
  }

  return (
    <Suspense fallback={<FileViewerSkeleton fileName={fileName} />}>
      <FileViewerContent
        path={path}
        fileName={fileName}
        fileUrl={fileUrl}
        statType={statType}
        size={size}
        contentType={contentType}
        onDownload={handleDownloadFile}
      />
    </Suspense>
  );
}

function FileViewerContent({
  path,
  fileName,
  fileUrl,
  statType,
  size,
  contentType,
  onDownload,
}: {
  path: string;
  fileName: string;
  fileUrl: string;
  statType: string | null;
  size: number | null;
  contentType: string;
  onDownload: () => void;
}) {
  const { data } = useSuspenseQuery(filesQueryOptions({ path, statType, size }));

  // This route only handles files
  if (data.type === "directory") {
    return null;
  }

  if (data.type === "file-too-large") {
    return (
      <LargeFileWarning
        fileName={fileName}
        size={data.size}
        contentType={data.contentType || contentType}
        onDownload={onDownload}
      />
    );
  }

  return (
    <FileViewer
      fileUrl={fileUrl}
      html={data.html}
      fileName={fileName}
      onDownload={onDownload}
    />
  );
}

function FileNotFoundBoundary() {
  const { _splat } = Route.useParams();
  return <ExplorerNotFound path={_splat ?? ""} />;
}
