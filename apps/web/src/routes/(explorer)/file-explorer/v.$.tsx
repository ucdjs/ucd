import { FileViewer, FileViewerSkeleton } from "#components/file-explorer/file-viewer";
import { LargeFileWarning } from "#components/file-explorer/large-file-warning";
import { NonRenderableFile } from "#components/file-explorer/non-renderable-file";
import { ExplorerNotFound } from "#components/not-found";
import { getFileHeadInfo } from "#functions/files";
import { shikiHtmlQueryOptions } from "#functions/shiki";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { resolveUCDVersion } from "@unicode-utils/core";
import { Suspense } from "react";
import { NON_RENDERABLE_EXTENSIONS } from "../../../lib/file-explorer";

const MAX_INLINE_FILE_SIZE = 512 * 1024;

export const Route = createFileRoute("/(explorer)/file-explorer/v/$")({
  component: FileViewerPage,
  async beforeLoad({ params }) {
    let path = params._splat || "";
    const hasTrailingSlash = path.endsWith("/");
    const pathSegments = path.split("/").filter(Boolean);

    if (pathSegments.length > 0) {
      const version = pathSegments[0] ?? "";
      const rest = pathSegments.slice(1);
      const resolvedVersion = resolveUCDVersion(version);
      if (resolvedVersion !== version) {
        const nextPath = [resolvedVersion, ...rest].join("/");
        throw redirect({
          to: "/file-explorer/v/$",
          params: { _splat: hasTrailingSlash ? `${nextPath}/` : nextPath },
        });
      }
      path = hasTrailingSlash ? `${[resolvedVersion, ...rest].join("/")}/` : [resolvedVersion, ...rest].join("/");
    }

    const { statType, size } = await getFileHeadInfo({ data: { path } });

    if (statType !== "file") {
      throw redirect({
        to: "/file-explorer/$",
        params: { _splat: path },
      });
    }

    // Extract file info for early checks
    const filePathSegments = path.split("/").filter(Boolean);
    const fileName = filePathSegments[filePathSegments.length - 1] || "file";
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

    // Only prefetch if we'll actually render the file content
    if (!isTooLarge && canRender) {
      context.queryClient.prefetchQuery(shikiHtmlQueryOptions(context.path));
    }

    return {
      statType: context.statType,
      size: context.size,
      fileName: context.fileName,
      fileExt: context.fileExt,
      path: context.path,
      isTooLarge,
      canRender,
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
    fileUrl,
  } = loaderData;

  // Check for large files first - no data fetching needed
  if (isTooLarge) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <LargeFileWarning
          fileName={fileName}
          size={size}
          downloadUrl={fileUrl}
          contentType="application/octet-stream"
        />
      </div>
    );
  }

  // Check for non-renderable files - no data fetching needed
  if (!canRender) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <NonRenderableFile
          fileName={fileName}
          contentType="application/octet-stream"
          fileUrl={fileUrl}
        />
      </div>
    );
  }

  // Wrap the actual file content fetching in Suspense
  return (
    <div className="flex flex-1 flex-col gap-6">
      <Suspense fallback={<FileViewerSkeleton fileName={fileName} />}>
        <FileViewerContent
          path={path}
          fileName={fileName}
          fileUrl={loaderData.fileUrl}
        />
      </Suspense>
    </div>
  );
}

function FileViewerContent({
  path,
  fileName,
  fileUrl,
}: {
  path: string;
  fileName: string;
  fileUrl: string;
}) {
  const { data: html } = useSuspenseQuery(shikiHtmlQueryOptions(path));

  return (
    <FileViewer
      html={html}
      fileName={fileName}
      fileUrl={fileUrl}
    />
  );
}

function FileNotFoundBoundary() {
  const { _splat } = Route.useParams();
  return <ExplorerNotFound path={_splat ?? ""} />;
}
