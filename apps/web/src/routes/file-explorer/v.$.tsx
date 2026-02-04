import { FileViewer, FileViewerSkeleton } from "#components/file-explorer/file-viewer";
import { LargeFileWarning } from "#components/file-explorer/large-file-warning";
import { NON_RENDERABLE_EXTENSIONS, NonRenderableFile } from "#components/file-explorer/non-renderable-file";
import { ExplorerNotFound } from "#components/not-found";
import { filesQueryOptions, getFileHeadInfo, highlightedFileQueryOptions } from "#functions/files";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";

/**
 * Maximum file size to render inline (1MB)
 * Files larger than this will show the large file warning
 */
const MAX_INLINE_FILE_SIZE = 1024 * 1024;

const MAX_HIGHLIGHT_FILE_SIZE = 500 * 1024;

export const Route = createFileRoute("/file-explorer/v/$")({
  component: FileViewerPage,
  async beforeLoad({ params }) {
    const path = params._splat || "";

    const { statType, size } = await getFileHeadInfo({ data: { path } });

    if (statType !== "file") {
      throw redirect({
        to: "/file-explorer/$",
        params: { _splat: path },
      });
    }

    // Extract file info for early checks
    const pathSegments = path.split("/").filter(Boolean);
    const fileName = pathSegments[pathSegments.length - 1] || "file";
    const fileExt = fileName.split(".").pop()?.toLowerCase() || "";

    return {
      path,
      statType,
      size,
      fileName,
      fileExt,
    };
  },
  loader: async ({ context }) => {
    const isTooLarge = context.size > MAX_INLINE_FILE_SIZE;
    const canRender = !NON_RENDERABLE_EXTENSIONS.has(context.fileExt);
    const canHighlight = context.size <= MAX_HIGHLIGHT_FILE_SIZE;

    // Only prefetch if we'll actually render the file content
    if (!isTooLarge && canRender) {
      await Promise.all([
        context.queryClient.prefetchQuery(filesQueryOptions({
          path: context.path,
          statType: context.statType,
          size: context.size,
        })),
        canHighlight
          ? context.queryClient.prefetchQuery(highlightedFileQueryOptions(context.path, {
              statType: context.statType,
              size: context.size,
            }))
          : Promise.resolve(),
      ]);
    }

    return {
      statType: context.statType,
      size: context.size,
      fileName: context.fileName,
      fileExt: context.fileExt,
      path: context.path,
      isTooLarge,
      canRender,
      canHighlight,
      fileUrl: new URL(context.path, `${context.apiBaseUrl}/api/v1/files/`).toString(),
    };
  },
  notFoundComponent: FileNotFoundBoundary,
});

function FileViewerPage() {
  const loaderData = Route.useLoaderData();
  const {
    size,
    fileName,
    path,
    isTooLarge,
    canRender,
    canHighlight,
    fileUrl,
  } = loaderData;

  // Check for large files first - no data fetching needed
  if (isTooLarge) {
    return (
      <LargeFileWarning
        fileName={fileName}
        size={size}
        downloadUrl={fileUrl}
        contentType="application/octet-stream"
      />
    );
  }

  // Check for non-renderable files - no data fetching needed
  if (!canRender) {
    return (
      <NonRenderableFile
        fileName={fileName}
        contentType="application/octet-stream"
        fileUrl={fileUrl}
      />
    );
  }

  // Wrap the actual file content fetching in Suspense
  return (
    <Suspense fallback={<FileViewerSkeleton fileName={fileName} />}>
      <FileViewerContent
        path={path}
        fileName={fileName}
        statType={loaderData.statType}
        size={loaderData.size}
        canHighlight={canHighlight}
      />
    </Suspense>
  );
}

/**
 * Component that fetches and renders file content
 * Separated to enable Suspense boundary around data fetching
 */
function FileViewerContent({
  path,
  fileName,
  statType,
  size,
  canHighlight,
}: {
  path: string;
  fileName: string;
  statType: string | null;
  size: number;
  canHighlight: boolean;
}) {
  const { data } = useSuspenseQuery(filesQueryOptions({ path, statType, size }));
  const highlightedQuery = useQuery(
    highlightedFileQueryOptions(path, { statType, size }),
  );

  // This route only handles files
  if (data.type === "directory" || data.type === "file-too-large") {
    return null;
  }

  return (
    <FileViewer
      content={data.content}
      contentType={data.contentType}
      fileName={fileName}
      filePath={path}
      html={highlightedQuery.data?.html}
    />
  );
}

function FileNotFoundBoundary() {
  const { _splat } = Route.useParams();
  return <ExplorerNotFound path={_splat ?? ""} />;
}
