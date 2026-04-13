import { FileViewer, FileViewerSkeleton } from "#components/file-explorer/file-viewer";
import { LargeFileWarning } from "#components/file-explorer/large-file-warning";
import { NonRenderableFile } from "#components/file-explorer/non-renderable-file";
import { ExplorerNotFound } from "#components/not-found";
import { filesQueryOptions, getFileHeadInfo } from "#functions/files";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { resolveUCDVersion } from "@unicode-utils/core";
import { Suspense } from "react";
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

  // Check for non-renderable files - no data fetching needed
  if (!canRender) {
    return (
      <NonRenderableFile
        fileName={fileName}
        contentType={contentType}
        fileUrl={fileUrl}
      />
    );
  }

  // Check for large files first - no data fetching needed
  if (size !== null && isTooLarge) {
    return (
      <LargeFileWarning
        fileName={fileName}
        size={size}
        downloadUrl={fileUrl}
        contentType={contentType}
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
}: {
  path: string;
  fileName: string;
  fileUrl: string;
  statType: string | null;
  size: number | null;
  contentType: string;
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
        downloadUrl={data.downloadUrl}
        contentType={data.contentType || contentType}
      />
    );
  }

  return (
    <FileViewer
      fileUrl={fileUrl}
      html={data.html}
      fileName={fileName}
    />
  );
}

function FileNotFoundBoundary() {
  const { _splat } = Route.useParams();
  return <ExplorerNotFound path={_splat ?? ""} />;
}
