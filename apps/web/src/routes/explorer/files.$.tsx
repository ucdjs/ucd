import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

import { filesQueryOptions } from "@/apis/files";
import {
  FileExplorer,
  FileViewer,
  NON_RENDERABLE_EXTENSIONS,
  NonRenderableFile,
} from "@/components/file-explorer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/explorer/files/$")({
  component: FilesExplorerPage,
  loader: ({ context, params }) => {
    const path = params._splat || "";
    context.queryClient.ensureQueryData(filesQueryOptions(path));
  },
});

function FilesExplorerPage() {
  const { _splat: path = "" } = Route.useParams();
  const { data, isLoading } = useSuspenseQuery(filesQueryOptions(path));

  // Build breadcrumb segments
  const pathSegments = path ? path.split("/").filter(Boolean) : [];

  const isFile = data.type === "file";
  const fileName = pathSegments[pathSegments.length - 1] || "file";
  const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
  const canRender = !NON_RENDERABLE_EXTENSIONS.has(fileExt);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/" />}>
                  <Home className="size-4" />
                  <span className="sr-only">Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/explorer" />}>
                  Explorer
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {pathSegments.length === 0
                  ? (
                      <BreadcrumbPage>Files</BreadcrumbPage>
                    )
                  : (
                      <BreadcrumbLink render={<Link to="/explorer/files/$" params={{ _splat: "" }} />}>
                        Files
                      </BreadcrumbLink>
                    )}
              </BreadcrumbItem>
              {pathSegments.map((segment: string, index: number) => {
                const segmentPath = pathSegments.slice(0, index + 1).join("/");
                const isLast = index === pathSegments.length - 1;

                return (
                  <BreadcrumbItem key={segmentPath}>
                    <BreadcrumbSeparator>
                      <ChevronRight className="size-4" />
                    </BreadcrumbSeparator>
                    {isLast
                      ? (
                          <BreadcrumbPage>{segment}</BreadcrumbPage>
                        )
                      : (
                          <BreadcrumbLink
                            render={<Link to="/explorer/files/$" params={{ _splat: segmentPath }} />}
                          >
                            {segment}
                          </BreadcrumbLink>
                        )}
                  </BreadcrumbItem>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            {path ? `/${path}` : "File Explorer"}
          </h1>
        </div>

        {isFile
          ? canRender
            ? (
                <FileViewer
                  content={data.content}
                  contentType={data.contentType}
                  fileName={fileName}
                  filePath={path}
                />
              )
            : (
                <NonRenderableFile
                  fileName={fileName}
                  filePath={path}
                  contentType={data.contentType}
                />
              )
          : (
              <FileExplorer
                files={data.files}
                currentPath={path}
                isLoading={isLoading}
              />
            )}
      </div>
    </>
  );
}
