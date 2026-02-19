import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { Separator } from "@ucdjs-internal/shared-ui/ui/separator";
import { SidebarTrigger } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { ChevronRight, FolderOpen, Home } from "lucide-react";
import { Suspense } from "react";
import { Fragment } from "react/jsx-runtime";

export const Route = createFileRoute("/file-explorer")({
  component: FileExplorerLayout,
});

function FileExplorerLayout() {
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];

  // Extract path from the current route params
  const path = (lastMatch?.params as { _splat?: string })?._splat || "";
  const pathSegments = path ? path.split("/").filter(Boolean) : [];

  // Determine if we're viewing a file (v.$.tsx route)
  const isViewingFile = lastMatch?.routeId === "/file-explorer/v/$";

  // Determine if we're at the root
  const isRoot = pathSegments.length === 0 && !isViewingFile;

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb className="flex-1 overflow-hidden">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbLink
                  render={<Link to="/" />}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="size-3.5" />
                  <span className="sr-only">Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="shrink-0">
                <ChevronRight className="size-3.5" />
              </BreadcrumbSeparator>

              <BreadcrumbItem className="shrink-0">
                {isRoot
                  ? (
                      <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
                        <FolderOpen className="size-3.5 text-amber-500" />
                        File Explorer
                      </BreadcrumbPage>
                    )
                  : (
                      <BreadcrumbLink
                        render={<Link to="/file-explorer/$" params={{ _splat: "" }} />}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <FolderOpen className="size-3.5 text-amber-500" />
                        <span className="hidden sm:inline">File Explorer</span>
                      </BreadcrumbLink>
                    )}
              </BreadcrumbItem>

              {pathSegments.map((segment: string, index: number) => {
                const segmentPath = pathSegments.slice(0, index + 1).join("/");
                const isLast = index === pathSegments.length - 1;

                return (
                  <Fragment key={segmentPath}>
                    <BreadcrumbSeparator className="shrink-0">
                      <ChevronRight className="size-3.5" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem className="min-w-0">
                      {isLast
                        ? (
                            <BreadcrumbPage className="truncate font-medium max-w-50" title={segment}>
                              {segment}
                            </BreadcrumbPage>
                          )
                        : (
                            <BreadcrumbLink
                              render={(
                                <Link
                                  to="/file-explorer/$"
                                  params={{ _splat: segmentPath }}
                                />
                              )}
                              className="truncate max-w-37.5 text-muted-foreground hover:text-foreground transition-colors"
                              title={segment}
                            >
                              {segment}
                            </BreadcrumbLink>
                          )}
                    </BreadcrumbItem>
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 pt-2">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </>
  );
}
