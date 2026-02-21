import { Link, useMatches } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { ChevronRight, FolderOpen, Home } from "lucide-react";
import { Fragment } from "react";

export function FileExplorerHeader() {
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const path = (lastMatch?.params as { _splat?: string })?._splat || "";
  const pathSegments = path ? path.split("/").filter(Boolean) : [];
  const isViewingFile = lastMatch?.routeId === "/(explorer)/file-explorer/v/$";
  const isRoot = pathSegments.length === 0 && !isViewingFile;

  return (
    <div className="flex items-center border-b bg-background/70 px-4 py-2">
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
  );
}
