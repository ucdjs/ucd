import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { FileViewer } from "@/components/file-explorer/file-viewer";
import { LargeFileWarning } from "@/components/file-explorer/large-file-warning";
import { NON_RENDERABLE_EXTENSIONS, NonRenderableFile } from "@/components/file-explorer/non-renderable-file";
import { ExplorerNotFound } from "@/components/not-found";
import { filesQueryOptions, getFileHeadInfo } from "@/functions/files";

export const Route = createFileRoute("/file-explorer/v/$")({
  component: FileViewerPage,
  async beforeLoad({ params, search }) {
    const path = params._splat || "";

    const { statType } = await getFileHeadInfo({ data: { path, search } });

    if (statType !== "file") {
      throw redirect({
        to: "/file-explorer/$",
        params: { _splat: path },
      });
    }

    return {
      path,
      statType,
    };
  },
  loader: async ({ context }) => {
    context.queryClient.prefetchQuery(filesQueryOptions(context.path));
  },
  notFoundComponent: FileNotFoundBoundary,
});

function FileViewerPage() {
  const { _splat: path = "" } = Route.useParams();
  const { data } = useSuspenseQuery(filesQueryOptions(path));

  const pathSegments = path.split("/").filter(Boolean);
  const fileName = pathSegments[pathSegments.length - 1] || "file";
  const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
  const canRender = !NON_RENDERABLE_EXTENSIONS.has(fileExt);

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
        contentType={data.contentType}
      />
    );
  }

  if (!canRender) {
    return (
      <NonRenderableFile
        fileName={fileName}
        filePath={path}
        contentType={data.contentType}
      />
    );
  }

  return (
    <FileViewer
      content={data.content}
      contentType={data.contentType}
      fileName={fileName}
      filePath={path}
    />
  );
}

function FileNotFoundBoundary() {
  const { _splat } = Route.useParams();
  return <ExplorerNotFound path={_splat ?? ""} />;
}
